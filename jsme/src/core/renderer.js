import { GLPainter } from './painter.js';
import { pixelToTile, tileToPixel, marginTiles, visibleOrigin } from './pointer.js';

// Ruler strip thickness in px, and how often (in tiles) a tick gets a label.
const RULER_SIZE = 20;
const MAJOR_TICK_EVERY = 5;
// Rulers only ever hold a few tiny tick labels, so their glyph atlas can stay small.
const RULER_ATLAS_SIZE = 256;

/**
 * Imperative WebGL renderer for the map editor.
 *
 * Canvas drawing does not benefit from Vue's reactivity (it is thousands
 * of sprites per frame, not DOM diffing), so this stays a plain class
 * that reads from the store/tools on demand. Components explicitly call
 * render(mode) after an action that changes what's on screen - mirroring
 * how the store makes no assumption about when a redraw is due.
 *
 * Drawing goes through GLPainter (see painter.js), which batches sprites
 * into a handful of GPU draw calls behind a Canvas 2D-like API. Every
 * floor is rendered into its own Layer (an offscreen framebuffer) and the
 * visible ones are stacked onto the canvas in composite(), so a redraw of
 * just the HUD ('gui' mode) never has to walk the map again.
 */
export class MapRenderer {
  constructor(store, tools, config) {
    this.store = store;
    this.tools = tools;
    this.config = config;
    this.painter = null; // GLPainter for the map canvas
    this.rulerH = null; // GLPainter for the horizontal ruler
    this.rulerV = null; // GLPainter for the vertical ruler
    this.hud = null; // Layer, current floor's tool/selection overlay
    this.floors = {}; // z -> Layer, created the first time that floor is rendered
  }

  attach({ canvas, rulerH = null, rulerV = null }) {
    this.detach();
    this.painter = new GLPainter(canvas);
    // A lost GPU context wipes every texture and layer; once the browser
    // hands it back, rebuild the whole picture from the store.
    this.painter.onContextRestored = () => this.render('all');
    this.hud = this.painter.createLayer(1, 1);
    this.floors = {};
    this.rulerH = rulerH ? new GLPainter(rulerH, { atlasSize: RULER_ATLAS_SIZE }) : null;
    this.rulerV = rulerV ? new GLPainter(rulerV, { atlasSize: RULER_ATLAS_SIZE }) : null;
    this.resize();
  }

  detach() {
    this.painter?.dispose();
    this.rulerH?.dispose();
    this.rulerV?.dispose();
    this.painter = null;
    this.rulerH = null;
    this.rulerV = null;
    this.hud = null;
    this.floors = {};
  }

  resize() {
    if (!this.painter) return;
    const bounds = this.painter.canvas.parentElement.getBoundingClientRect();
    const width = Math.floor(bounds.width);
    const height = Math.floor(bounds.height);
    this.painter.resize(width, height);
    this.hud.resize(width, height);
    for (const layer of Object.values(this.floors)) {
      layer.resize(width, height);
    }
    this.rulerH?.resize(width, RULER_SIZE);
    this.rulerV?.resize(RULER_SIZE, height);
    this.render('all');
  }

  /** mode: 'all' (regenerate every floor), 'current' (only the active floor), or 'gui' (HUD + composite only). */
  render(mode = 'all') {
    if (!this.painter) return;
    const { store, config } = this;

    if (mode === 'all' || mode === 'current') {
      for (let z = config.minFloor; z <= config.maxFloor; z++) {
        if (mode === 'current' && z !== store.state.currentFloor) continue;
        if (!this.isFloorVisible(z)) continue;
        this.renderFloor(z);
      }
    }

    this.renderHud();
    this.composite();
    this.renderRulers();
  }

  isFloorVisible(z) {
    const { currentFloor } = this.store.state;
    return !(z > currentFloor || (currentFloor >= 0 && z < 0));
  }

  /**
   * The panning/parallax geometry for one floor: how many tiles "behind"
   * the map's stacking reference (`maxFloor`) it sits, the tile it starts
   * showing at (`originX/Y`), and the pixel margin still reserved for it
   * (`marginPxX/Y`). Panning trades one for the other one tile at a time
   * (see pointer.js), so every consumer of "where does this floor's
   * content begin" goes through here to stay in lockstep.
   */
  floorGeometry(z) {
    const { store, config } = this;
    const baseOffset = config.maxFloor - z;
    return {
      originX: visibleOrigin(baseOffset, store.state.renderFromX),
      originY: visibleOrigin(baseOffset, store.state.renderFromY),
      marginPxX: marginTiles(baseOffset, store.state.renderFromX) * config.tileSize,
      marginPxY: marginTiles(baseOffset, store.state.renderFromY) * config.tileSize,
    };
  }

  floorLayer(z) {
    this.floors[z] ??= this.painter.createLayer(this.painter.width, this.painter.height);
    return this.floors[z];
  }

  renderFloor(z) {
    const { store, config, painter: ctx } = this;
    const layer = this.floorLayer(z);
    ctx.setTarget(layer);

    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, layer.width, layer.height);
    ctx.globalAlpha = z !== 0 && z !== config.minFloor ? 0.5 : 1;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, layer.width, layer.height);
    ctx.globalAlpha = 1;

    const { originX, originY } = this.floorGeometry(z);
    const { highlightedItem } = store.state;
    const colsVisible = layer.width / config.tileSize;
    const rowsVisible = layer.height / config.tileSize;

    for (let y = originY; y <= originY + rowsVisible; y++) {
      for (let x = originX; x <= originX + colsVisible; x++) {
        const tile = store.getTile(x, y, z);
        if (!tile) continue;

        tile.forEach((entry, index) => {
          const item = store.getItem(entry.id);
          if (!item) return;

          const drawX = (x - originX) * config.tileSize + (config.tileSize - item.image.width);
          const drawY = (y - originY) * config.tileSize + (config.tileSize - item.image.height);
          const isHighlighted =
            highlightedItem &&
            highlightedItem.x === x &&
            highlightedItem.y === y &&
            highlightedItem.z === z &&
            highlightedItem.itemId === entry.id &&
            index === tile.length - 1;

          if (isHighlighted) {
            ctx.drawImage(item.image, drawX - 6, drawY - 6);
            ctx.globalCompositeOperation = 'lighter';
            ctx.drawImage(item.image, drawX - 6, drawY - 6);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.drawImage(item.image, drawX, drawY);
          }
        });
      }
    }
  }

  renderHud() {
    const { store, tools, config, painter: ctx } = this;
    ctx.setTarget(this.hud);
    ctx.clearRect(0, 0, this.hud.width, this.hud.height);

    this.renderSelectionOverlay(ctx);

    const tool = tools[store.state.selectedTool];
    if (!tool?.onRender) return;

    const { originX, originY } = this.floorGeometry(store.state.currentFloor);
    const x = (store.state.cursorPosition.x - originX) * config.tileSize;
    const y = (store.state.cursorPosition.y - originY) * config.tileSize;
    tool.onRender({ ctx, x, y, z: store.state.currentFloor });
  }

  /** Draws the marquee rectangle for the current selection - only while looking at the floor it was made on. */
  renderSelectionOverlay(ctx) {
    const { store, config } = this;
    const selection = store.state.selection;
    if (!selection || selection.z !== store.state.currentFloor) return;

    const { originX, originY } = this.floorGeometry(store.state.currentFloor);
    const x = (selection.x1 - originX) * config.tileSize;
    const y = (selection.y1 - originY) * config.tileSize;
    const width = (selection.x2 - selection.x1 + 1) * config.tileSize;
    const height = (selection.y2 - selection.y1 + 1) * config.tileSize;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 170, 255, 0.12)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = 'rgba(0, 170, 255, 0.9)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    ctx.restore();
  }

  /** Stacks each visible floor's layer at its own margin (see floorGeometry) onto the canvas, topped by the HUD. */
  composite() {
    const { store, config, painter: ctx } = this;
    ctx.setTarget(null);
    ctx.clearRect(0, 0, ctx.width, ctx.height);

    for (let z = config.minFloor; z <= config.maxFloor; z++) {
      if (this.isFloorVisible(z)) {
        const { marginPxX, marginPxY } = this.floorGeometry(z);
        const layer = this.floors[z];
        if (layer) ctx.drawImage(layer, marginPxX, marginPxY);
        if (z === store.state.currentFloor) {
          ctx.drawImage(this.hud, marginPxX, marginPxY);
        }
      }
      if (z === store.state.currentFloor) break;
    }

    ctx.flush();
  }

  /** Draws the two position rulers flanking the map, with a marker for the current cursor tile. */
  renderRulers() {
    if (!this.rulerH || !this.rulerV) return;
    const { store } = this;
    const { originX, originY, marginPxX, marginPxY } = this.floorGeometry(store.state.currentFloor);

    this.renderRulerAxis(this.rulerH, 'x', originX, marginPxX, store.state.cursorPosition.x);
    this.renderRulerAxis(this.rulerV, 'y', originY, marginPxY, store.state.cursorPosition.y);
  }

  renderRulerAxis(ctx, axis, origin, marginPx, cursorTile) {
    const { config } = this;
    const length = axis === 'x' ? ctx.width : ctx.height;

    ctx.clearRect(0, 0, ctx.width, ctx.height);
    ctx.fillStyle = '#353535';
    ctx.fillRect(0, 0, ctx.width, ctx.height);

    ctx.strokeStyle = '#6a6a6a';
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '9px sans-serif';
    ctx.lineWidth = 1;

    // No ticks inside the still-reserved margin - it has no tile to label yet.
    for (let pixel = marginPx; pixel <= length; pixel += config.tileSize) {
      const tile = pixelToTile(pixel, origin, marginPx, config.tileSize);
      const isMajor = tile % MAJOR_TICK_EVERY === 0;
      const tickSize = isMajor ? 8 : 4;

      ctx.beginPath();
      if (axis === 'x') {
        ctx.moveTo(pixel + 0.5, RULER_SIZE - tickSize);
        ctx.lineTo(pixel + 0.5, RULER_SIZE);
      } else {
        ctx.moveTo(RULER_SIZE - tickSize, pixel + 0.5);
        ctx.lineTo(RULER_SIZE, pixel + 0.5);
      }
      ctx.stroke();

      if (isMajor) {
        if (axis === 'x') {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(String(tile), pixel + 2, 2);
        } else {
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillText(String(tile), RULER_SIZE - 3, pixel + 2);
        }
      }
    }

    if (Number.isFinite(cursorTile)) {
      const markerPixel = tileToPixel(cursorTile, origin, marginPx, config.tileSize);
      if (markerPixel >= 0 && markerPixel <= length) {
        ctx.fillStyle = 'rgba(255, 203, 0, 0.85)';
        if (axis === 'x') {
          ctx.fillRect(markerPixel, RULER_SIZE - 3, config.tileSize, 3);
        } else {
          ctx.fillRect(RULER_SIZE - 3, markerPixel, 3, config.tileSize);
        }
      }
    }

    ctx.flush();
  }
}
