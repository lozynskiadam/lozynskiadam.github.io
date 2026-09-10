import { pixelToTile, tileToPixel, marginTiles, visibleOrigin } from './pointer.js';

// Ruler strip thickness in px, and how often (in tiles) a tick gets a label.
const RULER_SIZE = 20;
const MAJOR_TICK_EVERY = 5;

/**
 * Imperative canvas renderer for the map editor.
 *
 * Canvas drawing does not benefit from Vue's reactivity (it is thousands
 * of drawImage calls per frame, not DOM diffing), so this stays a plain
 * class that reads from the store/tools on demand. Components explicitly
 * call render(mode) after an action that changes what's on screen -
 * mirroring how the store makes no assumption about when a redraw is due.
 */
export class MapRenderer {
  constructor(store, tools, config) {
    this.store = store;
    this.tools = tools;
    this.config = config;
    this.canvas = null;
    this.rulerH = null;
    this.rulerV = null;
    this.hud = document.createElement('canvas');
    this.floors = {};
    for (let z = config.minFloor; z <= config.maxFloor; z++) {
      this.floors[z] = document.createElement('canvas');
    }
  }

  attach({ canvas, rulerH = null, rulerV = null }) {
    this.canvas = canvas;
    this.rulerH = rulerH;
    this.rulerV = rulerV;
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const { width, height } = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = width;
    this.canvas.height = height;
    this.hud.width = width;
    this.hud.height = height;
    for (const canvas of Object.values(this.floors)) {
      canvas.width = width;
      canvas.height = height;
    }
    if (this.rulerH) {
      this.rulerH.width = width;
      this.rulerH.height = RULER_SIZE;
    }
    if (this.rulerV) {
      this.rulerV.width = RULER_SIZE;
      this.rulerV.height = height;
    }
    this.render('all');
  }

  /** mode: 'all' (regenerate every floor), 'current' (only the active floor), or 'gui' (HUD + composite only). */
  render(mode = 'all') {
    if (!this.canvas) return;
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

  renderFloor(z) {
    const { store, config } = this;
    const canvas = this.floors[z];
    const ctx = canvas.getContext('2d');

    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = z !== 0 && z !== config.minFloor ? 0.5 : 1;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    const { originX, originY } = this.floorGeometry(z);
    const { highlightedItem } = store.state;
    const colsVisible = canvas.width / config.tileSize;
    const rowsVisible = canvas.height / config.tileSize;

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
    const { store, tools, config } = this;
    const ctx = this.hud.getContext('2d');
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

  /** Draws each visible floor's offscreen canvas at its own margin (see floorGeometry), topped by the HUD. */
  composite() {
    const { store, config } = this;
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let z = config.minFloor; z <= config.maxFloor; z++) {
      if (this.isFloorVisible(z)) {
        const { marginPxX, marginPxY } = this.floorGeometry(z);
        ctx.drawImage(this.floors[z], marginPxX, marginPxY);
        if (z === store.state.currentFloor) {
          ctx.drawImage(this.hud, marginPxX, marginPxY);
        }
      }
      if (z === store.state.currentFloor) break;
    }
  }

  /** Draws the two position rulers flanking the map, with a marker for the current cursor tile. */
  renderRulers() {
    if (!this.rulerH || !this.rulerV) return;
    const { store } = this;
    const { originX, originY, marginPxX, marginPxY } = this.floorGeometry(store.state.currentFloor);

    this.renderRulerAxis(this.rulerH, 'x', originX, marginPxX, store.state.cursorPosition.x);
    this.renderRulerAxis(this.rulerV, 'y', originY, marginPxY, store.state.cursorPosition.y);
  }

  renderRulerAxis(canvas, axis, origin, marginPx, cursorTile) {
    const { config } = this;
    const ctx = canvas.getContext('2d');
    const length = axis === 'x' ? canvas.width : canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#353535';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
  }
}
