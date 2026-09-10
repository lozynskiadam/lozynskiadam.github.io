import { watch } from '../vendor/vue.esm-browser.prod.js';
import { GLPainter } from './painter.js';
import { pixelToTile, tileToPixel, marginTiles, visibleOrigin } from './pointer.js';

// Ruler strip thickness in px, and how often (in tiles) a tick gets a label.
const RULER_SIZE = 20;
const MAJOR_TICK_EVERY = 5;
// Rulers only ever hold a few tiny tick labels, so their glyph atlas can stay small.
const RULER_ATLAS_SIZE = 256;
// Leg length (px) of the corner triangle marking items that carry custom properties.
const BADGE_SIZE = 7;

/**
 * Imperative WebGL renderer for the map editor.
 *
 * Canvas drawing does not benefit from Vue's reactivity (it is thousands
 * of sprites per frame, not DOM diffing), so this stays a plain class that
 * reads from the store/tools on demand. What it does borrow from Vue is
 * change detection: attach() watches the store and schedules a frame
 * whenever something visible changes - map edits via `state.mapRevision`
 * (with the store keeping track of which floors were touched), the view
 * geometry, and the HUD-related fields. Nothing else in the app ever asks
 * for a repaint; every request within one animation frame collapses into
 * a single render.
 *
 * Drawing goes through GLPainter (see painter.js), which batches sprites
 * into a handful of GPU draw calls behind a Canvas 2D-like API. Every
 * floor is rendered into its own Layer (an offscreen framebuffer) and the
 * visible ones are stacked onto the canvas in composite(), so a frame that
 * only moves the cursor never has to walk the map again.
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
    this.frame = 0; // pending requestAnimationFrame handle
    this.pendingAll = false; // whether the pending frame must redraw every floor
    this.dirtyFloors = new Set(); // floors the pending frame must redraw (besides what the store reports)
    this.stopWatchers = [];
  }

  attach({ canvas, rulerH = null, rulerV = null }) {
    this.detach();
    this.painter = new GLPainter(canvas);
    // A lost GPU context wipes every texture and layer; once the browser
    // hands it back, rebuild the whole picture from the store.
    this.painter.onContextRestored = () => this.invalidate('all');
    this.hud = this.painter.createLayer(1, 1);
    this.floors = {};
    this.rulerH = rulerH ? new GLPainter(rulerH, { atlasSize: RULER_ATLAS_SIZE }) : null;
    this.rulerV = rulerV ? new GLPainter(rulerV, { atlasSize: RULER_ATLAS_SIZE }) : null;
    this.subscribe();
    this.resize();
  }

  detach() {
    for (const stop of this.stopWatchers) stop();
    this.stopWatchers = [];
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.painter?.dispose();
    this.rulerH?.dispose();
    this.rulerV?.dispose();
    this.painter = null;
    this.rulerH = null;
    this.rulerV = null;
    this.hud = null;
    this.floors = {};
  }

  /**
   * Maps store changes onto render work. This is the one place to extend
   * when a new piece of state affects the picture: floor content goes
   * through `mapRevision`, anything that shifts the whole view needs 'all',
   * and anything the HUD draws just needs a frame.
   */
  subscribe() {
    const { state } = this.store;
    this.stopWatchers = [
      watch(() => state.mapRevision, () => this.invalidate()),
      watch(() => this.store.catalog.value, () => this.invalidate('all')),
      watch(
        () => [state.renderFromX, state.renderFromY, state.currentFloor],
        () => this.invalidate('all'),
      ),
      watch(
        () => [state.cursorPosition, state.selectedTool, state.brushSize, state.selectedItemId, state.selection, state.shiftDown],
        () => this.invalidate(),
      ),
      // The "lifted" glow is baked into the floor layer, so both the floor
      // that lost the highlight and the one that gained it need a redraw.
      watch(
        () => state.highlightedItem,
        (current, previous) => {
          if (previous) this.dirtyFloors.add(previous.z);
          if (current) this.dirtyFloors.add(current.z);
          this.invalidate();
        },
      ),
    ];
  }

  /**
   * Requests a frame. Floors the store marked dirty are always redrawn;
   * pass 'all' when every visible floor has to be (view moved, resize).
   */
  invalidate(mode = 'dirty') {
    if (mode === 'all') this.pendingAll = true;
    if (this.frame || !this.painter) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.renderNow();
    });
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
    this.store.setViewportSize(width, height);
    // Resizing blanks the canvas, so paint right away rather than leaving a frame of nothing.
    this.pendingAll = true;
    this.renderNow();
  }

  /** Paints immediately, consuming everything queued by invalidate() and the store. */
  renderNow() {
    if (!this.painter) return;
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
    const { store, config } = this;
    const dirty = store.takeDirtyFloors();
    const floors = new Set([...dirty.floors, ...this.dirtyFloors]);
    this.dirtyFloors.clear();

    if (this.pendingAll || dirty.all) {
      this.pendingAll = false;
      for (let z = config.minFloor; z <= config.maxFloor; z++) {
        if (this.isFloorVisible(z)) this.renderFloor(z);
      }
    } else {
      for (const z of floors) {
        // An invisible floor gets its turn when a floor change reveals it - that triggers 'all'.
        if (this.isFloorVisible(z)) this.renderFloor(z);
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
    const colsVisible = Math.ceil(layer.width / config.tileSize);
    const rowsVisible = Math.ceil(layer.height / config.tileSize);
    const badgedTiles = [];

    store.forEachTile(z, originX, originY, originX + colsVisible, originY + rowsVisible, (tile, x, y) => {
      const tileX = (x - originX) * config.tileSize;
      const tileY = (y - originY) * config.tileSize;

      if (tile.some(store.hasEntryProperties)) badgedTiles.push([tileX, tileY]);

      // Only the topmost entry of a tile can be the highlighted one.
      const highlightedIndex =
        highlightedItem &&
        highlightedItem.x === x &&
        highlightedItem.y === y &&
        highlightedItem.z === z &&
        highlightedItem.itemId === tile[tile.length - 1].id
          ? tile.length - 1
          : -1;

      for (let index = 0; index < tile.length; index++) {
        const item = store.getItem(tile[index].id);
        if (!item) continue;

        const drawX = tileX + (config.tileSize - item.image.width);
        const drawY = tileY + (config.tileSize - item.image.height);
        if (index === highlightedIndex) {
          ctx.drawImage(item.image, drawX - 6, drawY - 6);
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(item.image, drawX - 6, drawY - 6);
          ctx.globalCompositeOperation = 'source-over';
        } else {
          ctx.drawImage(item.image, drawX, drawY);
        }
      }
    });

    // Badges go on after every sprite of the floor: a tall item on the tile
    // below/right is drawn later and would otherwise cover them.
    for (const [x, y] of badgedTiles) {
      this.renderPropertiesBadge(ctx, x, y);
    }
  }

  /** Small blue triangle in a tile's top-right corner - the item there carries custom properties (see store.setEntryProperty). */
  renderPropertiesBadge(ctx, x, y) {
    const right = x + this.config.tileSize;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(right - BADGE_SIZE, y);
    ctx.lineTo(right, y);
    ctx.lineTo(right, y + BADGE_SIZE);
    ctx.closePath();
    ctx.fillStyle = '#00aaff';
    ctx.fill();
    // A soft black outline keeps the badge readable on light sprites without making it heavy.
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.restore();
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
