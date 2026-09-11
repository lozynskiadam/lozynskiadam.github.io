/**
 * WebGL-backed painter exposing the slice of the Canvas 2D API the editor
 * actually draws with (fillRect/strokeRect/drawImage/fillText, simple
 * paths, the usual style properties, save/restore), so MapRenderer and the
 * tools keep drawing the way they always did while every pixel goes
 * through the GPU.
 *
 * Draw calls are batched into one vertex buffer and only flushed when the
 * texture or blend mode changes: a whole floor of sprites ends up as a
 * single drawElements call, because item images are packed into a shared
 * texture atlas the first time they are drawn. Offscreen "canvases" are
 * Layers - framebuffer-backed textures that can be drawn like any image.
 */

const CONTEXT_ATTRIBUTES = {
  alpha: true,
  premultipliedAlpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  preserveDrawingBuffer: false,
};

const VERTEX_SHADER = `
attribute vec2 aPosition;
attribute vec2 aTexCoord;
attribute vec4 aColor;
uniform vec2 uResolution;
uniform float uFlipY;
varying vec2 vTexCoord;
varying vec4 vColor;
void main() {
  vec2 clip = aPosition / uResolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x, clip.y * uFlipY, 0.0, 1.0);
  vTexCoord = aTexCoord;
  vColor = aColor;
}`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uTexture;
varying vec2 vTexCoord;
varying vec4 vColor;
void main() {
  gl_FragColor = texture2D(uTexture, vTexCoord) * vColor;
}`;

// Vertex layout: x, y, u, v, r, g, b, a (colors premultiplied by alpha).
const FLOATS_PER_VERTEX = 8;
const VERTICES_PER_QUAD = 4;
const INDICES_PER_QUAD = 6;
// Keeps vertex indices within 16 bits (MAX_QUADS * 4 <= 65535).
const MAX_QUADS = 8192;
const ATLAS_PADDING = 1;
const TEXT_CACHE_LIMIT = 512;

// Everything is premultiplied, so "source-over" is the plain (1, 1 - a) blend.
const BLEND_MODES = {
  'source-over': ['ONE', 'ONE_MINUS_SRC_ALPHA'],
  lighter: ['ONE', 'ONE'],
  copy: ['ONE', 'ZERO'],
  'destination-out': ['ZERO', 'ONE_MINUS_SRC_ALPHA'],
  clear: ['ZERO', 'ZERO'],
};

/* ------------------------------------------------------------------ */
/* Color parsing                                                       */
/* ------------------------------------------------------------------ */

const colorCache = new Map();
let colorProbe = null;

const RGB_PATTERN = /^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i;

function parseHex(value) {
  if (value[0] !== '#') return null;
  const hex = value.slice(1);
  if (![3, 4, 6, 8].includes(hex.length) || !/^[0-9a-f]+$/i.test(hex)) return null;
  const short = hex.length <= 4;
  const step = short ? 1 : 2;
  const channels = [];
  for (let i = 0; i < hex.length; i += step) {
    const part = hex.slice(i, i + step);
    channels.push(parseInt(short ? part + part : part, 16) / 255);
  }
  if (channels.length === 3) channels.push(1);
  return channels;
}

function parseRgb(value) {
  const match = RGB_PATTERN.exec(value.trim());
  if (!match) return null;
  let alpha = 1;
  if (match[4] !== undefined) {
    alpha = match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4]);
  }
  return [Number(match[1]) / 255, Number(match[2]) / 255, Number(match[3]) / 255, alpha];
}

/** Lets a 2D context normalize anything else (named colors, hsl, ...) into a form the two parsers above understand. */
function parseViaCanvas(value) {
  colorProbe ??= document.createElement('canvas').getContext('2d');
  if (!colorProbe) return null;
  colorProbe.fillStyle = '#000000';
  colorProbe.fillStyle = value;
  const normalized = colorProbe.fillStyle;
  return parseHex(normalized) ?? parseRgb(normalized);
}

/** CSS color string -> [r, g, b, a] in 0..1, straight (not premultiplied) alpha. */
function parseColor(value) {
  const key = String(value);
  let color = colorCache.get(key);
  if (!color) {
    color = parseHex(key) ?? parseRgb(key) ?? parseViaCanvas(key) ?? [0, 0, 0, 1];
    colorCache.set(key, color);
  }
  return color;
}

/* ------------------------------------------------------------------ */
/* GL helpers                                                          */
/* ------------------------------------------------------------------ */

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${log}`);
  }
  return program;
}

/**
 * Empty RGBA texture with no wrapping (what NPOT sizes require in WebGL 1).
 * Sprites are sampled NEAREST for crisp pixel art; a Layer asks for LINEAR
 * because it is drawn scaled down when the view is zoomed out, and dropping
 * pixels there would make thin lines flicker.
 */
function createTexture(gl, width, height, filter = gl.NEAREST) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

/* ------------------------------------------------------------------ */
/* Texture atlas                                                       */
/* ------------------------------------------------------------------ */

/**
 * Shelf-packs images into as few big textures as possible so consecutive
 * sprites share one texture binding. Regions are handed out lazily and
 * remembered per source object; an image too big for a page gets a
 * dedicated texture of its own instead.
 */
class TextureAtlas {
  constructor(gl, size) {
    this.gl = gl;
    this.size = size;
    this.pages = [];
    this.regions = new WeakMap();
    this.whiteRegion = null;
  }

  /** A solid white spot used for every untextured fill, so rectangles batch together with sprites. */
  white() {
    if (!this.whiteRegion) {
      const { gl } = this;
      const region = this.allocate(4, 4);
      const pixels = new Uint8Array(4 * 4 * 4).fill(255);
      gl.bindTexture(gl.TEXTURE_2D, region.texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, region.x, region.y, 4, 4, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      // Sample the block's center only, so no neighbour can ever bleed in.
      const u = (region.u0 + region.u1) / 2;
      const v = (region.v0 + region.v1) / 2;
      this.whiteRegion = { texture: region.texture, width: 4, height: 4, u0: u, v0: v, u1: u, v1: v };
    }
    return this.whiteRegion;
  }

  /** Atlas region for an image/canvas, uploading it on first use. Null while the source has no pixels yet. */
  region(source) {
    let region = this.regions.get(source);
    if (region) return region;

    const width = source.width | 0;
    const height = source.height | 0;
    if (!width || !height) return null;

    region = this.allocate(width, height);
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, region.texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, region.x, region.y, gl.RGBA, gl.UNSIGNED_BYTE, source);
    this.regions.set(source, region);
    return region;
  }

  allocate(width, height) {
    const paddedWidth = width + ATLAS_PADDING;
    const paddedHeight = height + ATLAS_PADDING;
    const spot =
      paddedWidth > this.size || paddedHeight > this.size
        ? { page: this.createPage(width, height, true), x: 0, y: 0 }
        : this.allocateSpot(paddedWidth, paddedHeight);

    const { page, x, y } = spot;
    return {
      texture: page.texture,
      x,
      y,
      width,
      height,
      u0: x / page.width,
      v0: y / page.height,
      u1: (x + width) / page.width,
      v1: (y + height) / page.height,
    };
  }

  /** Exact-height shelf first, then a fresh shelf, then any shelf tall enough, then a new page. */
  allocateSpot(width, height) {
    const pages = this.pages.filter((page) => !page.dedicated);
    for (const page of pages) {
      for (const shelf of page.shelves) {
        if (shelf.height === height && shelf.x + width <= page.width) return this.take(page, shelf, width);
      }
    }
    for (const page of pages) {
      if (page.nextY + height <= page.height) return this.take(page, this.openShelf(page, height), width);
    }
    for (const page of pages) {
      for (const shelf of page.shelves) {
        if (shelf.height >= height && shelf.x + width <= page.width) return this.take(page, shelf, width);
      }
    }
    const page = this.createPage(this.size, this.size, false);
    return this.take(page, this.openShelf(page, height), width);
  }

  openShelf(page, height) {
    const shelf = { y: page.nextY, height, x: 0 };
    page.shelves.push(shelf);
    page.nextY += height;
    return shelf;
  }

  take(page, shelf, width) {
    const x = shelf.x;
    shelf.x += width;
    return { page, x, y: shelf.y };
  }

  createPage(width, height, dedicated) {
    const page = { texture: createTexture(this.gl, width, height), width, height, shelves: [], nextY: 0, dedicated };
    this.pages.push(page);
    return page;
  }

  reset() {
    for (const page of this.pages) this.gl.deleteTexture(page.texture);
    this.pages = [];
    this.regions = new WeakMap();
    this.whiteRegion = null;
  }
}

/* ------------------------------------------------------------------ */
/* Layers                                                              */
/* ------------------------------------------------------------------ */

/**
 * An offscreen render target: draw into it via painter.setTarget(layer),
 * then draw it anywhere with painter.drawImage(layer, x, y) - the WebGL
 * counterpart of an offscreen <canvas>.
 */
export class Layer {
  constructor(painter, width, height) {
    this.painter = painter;
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.texture = null;
    this.framebuffer = null;
    this.allocate();
  }

  allocate() {
    const { gl } = this.painter;
    this.texture = createTexture(gl, this.width, this.height, gl.LINEAR);
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** Like setting canvas.width/height: the layer comes back blank. */
  resize(width, height) {
    width = Math.max(1, Math.floor(width));
    height = Math.max(1, Math.floor(height));
    if (width === this.width && height === this.height) return;
    this.painter.flush();
    this.width = width;
    this.height = height;
    const { gl } = this.painter;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }

  region() {
    return { texture: this.texture, width: this.width, height: this.height, u0: 0, v0: 0, u1: 1, v1: 1 };
  }

  dispose() {
    const { gl } = this.painter;
    gl.deleteFramebuffer(this.framebuffer);
    gl.deleteTexture(this.texture);
    this.painter.layers.delete(this);
  }
}

/* ------------------------------------------------------------------ */
/* Painter                                                             */
/* ------------------------------------------------------------------ */

export class GLPainter {
  constructor(canvas, { atlasSize = 2048 } = {}) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', CONTEXT_ATTRIBUTES) || canvas.getContext('webgl', CONTEXT_ATTRIBUTES);
    if (!gl) throw new Error('WebGL is not available in this browser');
    this.gl = gl;
    this.atlasSize = Math.min(atlasSize, gl.getParameter(gl.MAX_TEXTURE_SIZE));

    this.layers = new Set();
    this.target = null; // null = the canvas itself, otherwise a Layer
    this.onContextRestored = null;

    // Canvas 2D-style state.
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
    this.font = '10px sans-serif';
    this.textAlign = 'start';
    this.textBaseline = 'alphabetic';
    this.lineDash = [];
    this.stateStack = [];
    this.subpaths = [];

    this.vertices = new Float32Array(MAX_QUADS * VERTICES_PER_QUAD * FLOATS_PER_VERTEX);
    this.quadCount = 0;
    this.batchTexture = null;
    this.batchBlend = 'source-over';
    this.textCache = new Map();
    this.textProbe = null;

    this.handleContextLost = (event) => event.preventDefault();
    this.handleContextRestored = () => {
      this.init();
      for (const layer of this.layers) layer.allocate();
      this.onContextRestored?.();
    };
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.init();
  }

  /** (Re)creates every GPU resource - run once up front and again after a context loss. */
  init() {
    const { gl } = this;
    this.program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    gl.useProgram(this.program);
    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, 'uResolution'),
      flipY: gl.getUniformLocation(this.program, 'uFlipY'),
      texture: gl.getUniformLocation(this.program, 'uTexture'),
    };
    gl.uniform1i(this.uniforms.texture, 0);

    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices.byteLength, gl.DYNAMIC_DRAW);
    const stride = FLOATS_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;
    const attributes = [
      ['aPosition', 2, 0],
      ['aTexCoord', 2, 8],
      ['aColor', 4, 16],
    ];
    for (const [name, size, offset] of attributes) {
      const location = gl.getAttribLocation(this.program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
    }

    const indices = new Uint16Array(MAX_QUADS * INDICES_PER_QUAD);
    for (let quad = 0, vertex = 0; quad < MAX_QUADS; quad++, vertex += VERTICES_PER_QUAD) {
      indices.set([vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3], quad * INDICES_PER_QUAD);
    }
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

    this.atlas = new TextureAtlas(gl, this.atlasSize);
    this.textCache.clear();
    this.quadCount = 0;
    this.batchTexture = null;
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  /** Like assigning canvas.width/height: resizes the drawing buffer, which also blanks it. */
  resize(width, height) {
    this.flush();
    this.canvas.width = Math.max(1, Math.floor(width));
    this.canvas.height = Math.max(1, Math.floor(height));
  }

  createLayer(width, height) {
    const layer = new Layer(this, width, height);
    this.layers.add(layer);
    return layer;
  }

  /** Redirects subsequent drawing into a Layer (or back to the canvas with null). */
  setTarget(layer) {
    if (layer === this.target) return;
    this.flush();
    this.target = layer;
  }

  targetWidth() {
    return this.target ? this.target.width : this.canvas.width;
  }

  targetHeight() {
    return this.target ? this.target.height : this.canvas.height;
  }

  bindTarget() {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.target ? this.target.framebuffer : null);
    gl.viewport(0, 0, this.targetWidth(), this.targetHeight());
  }

  /* ---- state ---------------------------------------------------- */

  save() {
    const { fillStyle, strokeStyle, lineWidth, globalAlpha, globalCompositeOperation, font, textAlign, textBaseline } = this;
    this.stateStack.push({
      fillStyle,
      strokeStyle,
      lineWidth,
      globalAlpha,
      globalCompositeOperation,
      font,
      textAlign,
      textBaseline,
      lineDash: [...this.lineDash],
    });
  }

  restore() {
    const saved = this.stateStack.pop();
    if (saved) Object.assign(this, saved);
  }

  setLineDash(segments) {
    this.lineDash = Array.from(segments, Number).filter((length) => Number.isFinite(length) && length >= 0);
  }

  getLineDash() {
    return [...this.lineDash];
  }

  /** Style color as premultiplied [r, g, b, a], with globalAlpha applied. */
  premultiplied(style) {
    const [r, g, b, a] = parseColor(style);
    const alpha = a * this.globalAlpha;
    return [r * alpha, g * alpha, b * alpha, alpha];
  }

  /* ---- batching ------------------------------------------------- */

  pushQuad(region, x, y, width, height, r, g, b, a, blend = this.globalCompositeOperation) {
    this.pushCorners(region, x, y, x + width, y, x + width, y + height, x, y + height, r, g, b, a, blend);
  }

  /** Corners go around the quad in order; UVs map region corners onto them the same way. */
  pushCorners(region, x0, y0, x1, y1, x2, y2, x3, y3, r, g, b, a, blend = this.globalCompositeOperation) {
    if (region.texture !== this.batchTexture || blend !== this.batchBlend || this.quadCount === MAX_QUADS) {
      this.flush();
      this.batchTexture = region.texture;
      this.batchBlend = blend;
    }

    const { u0, v0, u1, v1 } = region;
    const vertices = this.vertices;
    let i = this.quadCount * VERTICES_PER_QUAD * FLOATS_PER_VERTEX;
    // prettier-ignore
    {
      vertices[i++] = x0; vertices[i++] = y0; vertices[i++] = u0; vertices[i++] = v0; vertices[i++] = r; vertices[i++] = g; vertices[i++] = b; vertices[i++] = a;
      vertices[i++] = x1; vertices[i++] = y1; vertices[i++] = u1; vertices[i++] = v0; vertices[i++] = r; vertices[i++] = g; vertices[i++] = b; vertices[i++] = a;
      vertices[i++] = x2; vertices[i++] = y2; vertices[i++] = u1; vertices[i++] = v1; vertices[i++] = r; vertices[i++] = g; vertices[i++] = b; vertices[i++] = a;
      vertices[i++] = x3; vertices[i++] = y3; vertices[i++] = u0; vertices[i++] = v1; vertices[i++] = r; vertices[i++] = g; vertices[i++] = b; vertices[i++] = a;
    }
    this.quadCount++;
  }

  /** Submits everything queued so far as one draw call. Call it after the last drawing command of a frame. */
  flush() {
    if (this.quadCount === 0) return;
    const { gl } = this;

    this.bindTarget();
    gl.uniform2f(this.uniforms.resolution, this.targetWidth(), this.targetHeight());
    // Canvas pixels count from the top, framebuffer textures from the bottom;
    // flipping only when drawing straight to the canvas keeps a Layer's
    // texture upright when it is later drawn as an image.
    gl.uniform1f(this.uniforms.flipY, this.target ? 1 : -1);

    const [source, destination] = BLEND_MODES[this.batchBlend] ?? BLEND_MODES['source-over'];
    gl.blendFunc(gl[source], gl[destination]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.batchTexture);

    const floatCount = this.quadCount * VERTICES_PER_QUAD * FLOATS_PER_VERTEX;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices.subarray(0, floatCount));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.quadCount * INDICES_PER_QUAD, gl.UNSIGNED_SHORT, 0);

    this.quadCount = 0;
  }

  /* ---- drawing -------------------------------------------------- */

  clearRect(x, y, width, height) {
    if (x <= 0 && y <= 0 && x + width >= this.targetWidth() && y + height >= this.targetHeight()) {
      this.flush();
      const { gl } = this;
      this.bindTarget();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    this.pushQuad(this.atlas.white(), x, y, width, height, 0, 0, 0, 0, 'clear');
  }

  fillRect(x, y, width, height) {
    const [r, g, b, a] = this.premultiplied(this.fillStyle);
    this.pushQuad(this.atlas.white(), x, y, width, height, r, g, b, a);
  }

  strokeRect(x, y, width, height) {
    if (this.lineDash.length > 0) {
      this.strokePolyline([[x, y], [x + width, y], [x + width, y + height], [x, y + height]], true);
      return;
    }
    // Four edge rectangles that meet flush at the corners - pixel-exact for
    // the usual `strokeRect(x + 0.5, y + 0.5, ...)` with lineWidth 1.
    const [r, g, b, a] = this.premultiplied(this.strokeStyle);
    const white = this.atlas.white();
    const thickness = this.lineWidth;
    const half = thickness / 2;
    this.pushQuad(white, x - half, y - half, width + thickness, thickness, r, g, b, a);
    this.pushQuad(white, x - half, y + height - half, width + thickness, thickness, r, g, b, a);
    this.pushQuad(white, x - half, y + half, thickness, height - thickness, r, g, b, a);
    this.pushQuad(white, x + width - half, y + half, thickness, height - thickness, r, g, b, a);
  }

  /** Draws an image, canvas or Layer at (dx, dy), optionally scaled to dw x dh. */
  drawImage(source, dx, dy, dw, dh) {
    let region;
    if (source instanceof Layer) {
      if (source.painter !== this) return;
      region = source.region();
    } else {
      region = this.atlas.region(source);
    }
    if (!region) return;

    const alpha = this.globalAlpha;
    this.pushQuad(region, dx, dy, dw ?? region.width, dh ?? region.height, alpha, alpha, alpha, alpha);
  }

  /* ---- paths ---------------------------------------------------- */

  beginPath() {
    this.subpaths = [];
  }

  moveTo(x, y) {
    this.subpaths.push([[x, y]]);
  }

  lineTo(x, y) {
    if (this.subpaths.length === 0) {
      this.moveTo(x, y);
      return;
    }
    this.subpaths[this.subpaths.length - 1].push([x, y]);
  }

  closePath() {
    const current = this.subpaths[this.subpaths.length - 1];
    if (current) current.closed = true;
  }

  stroke() {
    for (const subpath of this.subpaths) this.strokePolyline(subpath, subpath.closed === true);
  }

  /** Fills each subpath as a convex polygon, fan-triangulated from its first point. */
  fill() {
    const [r, g, b, a] = this.premultiplied(this.fillStyle);
    const white = this.atlas.white();
    for (const points of this.subpaths) {
      for (let i = 1; i + 1 < points.length; i++) {
        const [x0, y0] = points[0];
        const [x1, y1] = points[i];
        const [x2, y2] = points[i + 1];
        // A quad whose last corner folds back onto the first is a triangle:
        // its second (zero-area) triangle rasterizes nothing.
        this.pushCorners(white, x0, y0, x1, y1, x2, y2, x0, y0, r, g, b, a);
      }
    }
  }

  /** Strokes a polyline segment by segment, honouring the current dash pattern (butt caps, no joins - fine for axis-aligned lines). */
  strokePolyline(points, closed) {
    if (points.length < 2) return;
    const [r, g, b, a] = this.premultiplied(this.strokeStyle);

    // An odd-length dash list repeats itself, as in Canvas 2D.
    const pattern = this.lineDash.length % 2 === 1 ? [...this.lineDash, ...this.lineDash] : this.lineDash;
    const dashed = pattern.some((length) => length > 0);
    let dashIndex = 0;
    let dashRemaining = dashed ? pattern[0] : Infinity;
    let penDown = true;

    const segmentCount = closed ? points.length : points.length - 1;
    for (let i = 0; i < segmentCount; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if (!dashed) {
        this.pushSegment(x1, y1, x2, y2, r, g, b, a);
        continue;
      }

      const length = Math.hypot(x2 - x1, y2 - y1);
      if (length === 0) continue;
      const dx = (x2 - x1) / length;
      const dy = (y2 - y1) / length;
      let position = 0;
      while (position < length) {
        const step = Math.min(dashRemaining, length - position);
        if (penDown && step > 0) {
          this.pushSegment(x1 + dx * position, y1 + dy * position, x1 + dx * (position + step), y1 + dy * (position + step), r, g, b, a);
        }
        position += step;
        dashRemaining -= step;
        if (dashRemaining <= 0) {
          dashIndex = (dashIndex + 1) % pattern.length;
          dashRemaining = pattern[dashIndex];
          penDown = !penDown;
        }
      }
    }
  }

  /** One straight stroke as a quad `lineWidth` thick, centered on the segment. */
  pushSegment(x1, y1, x2, y2, r, g, b, a) {
    const length = Math.hypot(x2 - x1, y2 - y1);
    if (length === 0) return;
    const half = this.lineWidth / 2;
    const nx = (-(y2 - y1) / length) * half;
    const ny = ((x2 - x1) / length) * half;
    this.pushCorners(this.atlas.white(), x1 + nx, y1 + ny, x2 + nx, y2 + ny, x2 - nx, y2 - ny, x1 - nx, y1 - ny, r, g, b, a);
  }

  /* ---- text ----------------------------------------------------- */

  fillText(text, x, y) {
    const label = this.rasterizeText(String(text));
    if (!label) return;

    let drawX = x;
    let drawY = y;
    switch (this.textAlign) {
      case 'right':
      case 'end':
        drawX -= label.width;
        break;
      case 'center':
        drawX -= label.width / 2;
        break;
      default:
        break;
    }
    switch (this.textBaseline) {
      case 'top':
      case 'hanging':
        break;
      case 'middle':
        drawY -= label.height / 2;
        break;
      case 'bottom':
      case 'ideographic':
        drawY -= label.height;
        break;
      default:
        drawY -= label.ascent;
        break;
    }

    const region = this.atlas.region(label.canvas);
    if (!region) return;
    const alpha = this.globalAlpha;
    this.pushQuad(region, Math.round(drawX), Math.round(drawY), label.width, label.height, alpha, alpha, alpha, alpha);
  }

  /**
   * Text is the one thing WebGL cannot do by itself, so each distinct label
   * is rasterized once through a tiny 2D canvas and cached as an atlas
   * sprite. The cache is bounded: once it fills up everything is dropped
   * (atlas included) and simply rebuilt on demand.
   */
  rasterizeText(text) {
    const key = `${this.font} ${this.fillStyle} ${text}`;
    let label = this.textCache.get(key);
    if (label) return label;

    if (this.textCache.size >= TEXT_CACHE_LIMIT) {
      this.flush();
      this.textCache.clear();
      this.atlas.reset();
    }

    this.textProbe ??= document.createElement('canvas').getContext('2d');
    const probe = this.textProbe;
    if (!probe) return null;
    probe.font = this.font;
    const metrics = probe.measureText(text);
    const fontSize = parseFloat(/(\d+(?:\.\d+)?)px/.exec(this.font)?.[1] ?? '10');
    const ascent = Math.ceil(metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent ?? fontSize * 0.8);
    const descent = Math.ceil(metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent ?? fontSize * 0.25);
    const width = Math.ceil(Math.max(metrics.width, (metrics.actualBoundingBoxLeft ?? 0) + (metrics.actualBoundingBoxRight ?? 0)));
    const height = ascent + descent;
    if (width <= 0 || height <= 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.font = this.font;
    ctx.fillStyle = this.fillStyle;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, 0, ascent);

    label = { canvas, width, height, ascent, descent };
    this.textCache.set(key, label);
    return label;
  }

  /* ---- teardown ------------------------------------------------- */

  dispose() {
    const { gl } = this;
    this.flush();
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    for (const layer of [...this.layers]) layer.dispose();
    this.atlas.reset();
    this.textCache.clear();
    gl.deleteBuffer(this.vertexBuffer);
    gl.deleteBuffer(this.indexBuffer);
    gl.deleteProgram(this.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
