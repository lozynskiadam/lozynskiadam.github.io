/**
 * Shared pixel <-> tile coordinate math for the floor-stacking (parallax)
 * effect: a floor `baseOffsetTiles` tiles "behind" the reference floor
 * reserves that many tiles of margin at the canvas's top/left edge.
 *
 * Panning happens in two phases so the view never jumps: the first
 * `baseOffsetTiles` pan steps only shrink the margin (the same tiles stay
 * on screen, just sliding closer to the corner); only once the margin is
 * fully gone does panning further actually reveal new map columns/rows.
 * Both phases move the view by exactly one tile per pan step - see
 * marginTiles/visibleOrigin below, and MapRenderer.floorGeometry(), which
 * is the single place these two are combined.
 */
export function marginTiles(baseOffsetTiles, panAmount) {
  return Math.max(0, baseOffsetTiles - panAmount);
}

export function visibleOrigin(baseOffsetTiles, panAmount) {
  return Math.max(0, panAmount - baseOffsetTiles);
}

/** Pixel position where `tile` begins, given the axis's visible origin (first shown tile) and its margin in px. */
export function tileToPixel(tile, origin, marginPx, tileSize) {
  return marginPx + (tile - origin) * tileSize;
}

/** Inverse of tileToPixel: which tile a canvas pixel falls in (not clamped to the visible origin). */
export function pixelToTile(pixel, origin, marginPx, tileSize) {
  return origin + Math.floor((pixel - marginPx) / tileSize);
}

/** Converts a mouse event over the map canvas into map tile coordinates for the current floor. */
export function screenToTile(event, canvasEl, store, config) {
  const bounds = canvasEl.getBoundingClientRect();
  const baseOffset = config.maxFloor - store.state.currentFloor;

  const originX = visibleOrigin(baseOffset, store.state.renderFromX);
  const originY = visibleOrigin(baseOffset, store.state.renderFromY);
  const marginPxX = marginTiles(baseOffset, store.state.renderFromX) * config.tileSize;
  const marginPxY = marginTiles(baseOffset, store.state.renderFromY) * config.tileSize;

  const rawX = pixelToTile(event.clientX - bounds.left, originX, marginPxX, config.tileSize);
  const rawY = pixelToTile(event.clientY - bounds.top, originY, marginPxY, config.tileSize);

  return {
    x: Math.max(rawX, originX),
    y: Math.max(rawY, originY),
  };
}
