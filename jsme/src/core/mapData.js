/**
 * The map itself: a sparse floor -> row -> column -> stack structure, where
 * every stack is an array of placed entries ({ id, ...customProperties }).
 *
 * This module is deliberately dumb - plain data, no knowledge of the item
 * catalog, layers, selection or rendering. The store layers the editing
 * rules on top of it. Keeping it separate means the storage format has a
 * single owner (see toJSON/replace) and can be tested without a browser.
 */

/** Cell key inside a block, offset from the block's top-left corner. */
export function cellKey(dx, dy) {
  return `${dx},${dy}`;
}

export function parseCellKey(key) {
  const [dx, dy] = key.split(',');
  return [Number(dx), Number(dy)];
}

/** Copies an entry so two tiles never share (and accidentally co-mutate) the same instance. */
export function cloneEntry(entry) {
  return { ...entry };
}

/** Structural check for a parsed map file - guards against feeding garbage into the editor. */
export function isValidMapData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  for (const floor of Object.values(value)) {
    if (!floor || typeof floor !== 'object' || Array.isArray(floor)) return false;
    for (const row of Object.values(floor)) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
      for (const stack of Object.values(row)) {
        if (!Array.isArray(stack)) return false;
        if (!stack.every((entry) => entry && typeof entry === 'object' && Number.isFinite(entry.id))) return false;
      }
    }
  }
  return true;
}

export function createMapData() {
  let floors = {};

  function getTile(x, y, z) {
    return floors[z]?.[y]?.[x] ?? null;
  }

  function ensureTile(x, y, z) {
    floors[z] ??= {};
    floors[z][y] ??= {};
    floors[z][y][x] ??= [];
    return floors[z][y][x];
  }

  /** Removes an emptied stack and any row/floor object left empty behind it. */
  function pruneTile(x, y, z) {
    const tile = floors[z]?.[y]?.[x];
    if (!tile || tile.length > 0) return;
    delete floors[z][y][x];
    if (Object.keys(floors[z][y]).length === 0) delete floors[z][y];
    if (Object.keys(floors[z]).length === 0) delete floors[z];
  }

  function clearTile(x, y, z) {
    const tile = floors[z]?.[y]?.[x];
    if (!tile) return false;
    tile.length = 0;
    pruneTile(x, y, z);
    return true;
  }

  /** Replaces a tile's whole content (an empty list removes the tile). Used by undo/redo. */
  function setTile(x, y, z, entries) {
    if (entries.length === 0) {
      clearTile(x, y, z);
      return;
    }
    const tile = ensureTile(x, y, z);
    tile.length = 0;
    tile.push(...entries);
  }

  /** Visits every non-empty tile of a floor inside an inclusive rectangle, skipping absent rows wholesale. */
  function forEachTile(z, x1, y1, x2, y2, callback) {
    const floor = floors[z];
    if (!floor) return;
    for (let y = y1; y <= y2; y++) {
      const row = floor[y];
      if (!row) continue;
      for (let x = x1; x <= x2; x++) {
        const tile = row[x];
        if (tile && tile.length > 0) callback(tile, x, y);
      }
    }
  }

  /** Deep-copies a rectangular area into a floor-agnostic block keyed by offset from its top-left corner. */
  function snapshot(x1, y1, x2, y2, z) {
    const cells = {};
    forEachTile(z, x1, y1, x2, y2, (tile, x, y) => {
      cells[cellKey(x - x1, y - y1)] = tile.map(cloneEntry);
    });
    return { width: x2 - x1 + 1, height: y2 - y1 + 1, cells };
  }

  function clear(x1, y1, x2, y2, z) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) clearTile(x, y, z);
    }
  }

  /** Stamps a block onto the map, replacing every covered tile wholesale - including clearing tiles the block has empty. */
  function stamp(originX, originY, z, block) {
    for (let dy = 0; dy < block.height; dy++) {
      for (let dx = 0; dx < block.width; dx++) {
        const x = originX + dx;
        const y = originY + dy;
        if (x < 0 || y < 0) continue;
        const source = block.cells[cellKey(dx, dy)];
        if (source && source.length > 0) {
          const tile = ensureTile(x, y, z);
          tile.length = 0;
          tile.push(...source.map(cloneEntry));
        } else {
          clearTile(x, y, z);
        }
      }
    }
  }

  function isEmpty() {
    return Object.keys(floors).length === 0;
  }

  function reset() {
    floors = {};
  }

  /** Swaps in already-validated (see isValidMapData) file content. */
  function replace(data) {
    floors = data;
  }

  /** The serializable form - exactly what a map file contains. */
  function toJSON() {
    return floors;
  }

  return {
    getTile,
    ensureTile,
    pruneTile,
    clearTile,
    setTile,
    forEachTile,
    snapshot,
    clear,
    stamp,
    isEmpty,
    reset,
    replace,
    toJSON,
  };
}
