import { cloneEntry } from './mapData.js';

/**
 * Undo/redo for the map, recorded at tile granularity.
 *
 * The store calls record() for a tile right before touching it; the first
 * call per step remembers the tile's content as it was. commit() then
 * compares each recorded tile with its current content and keeps only the
 * ones that actually changed, as a single undoable step. Undo/redo simply
 * write the remembered contents back, so any mutation - painting, moving,
 * pasting, editing properties - is covered without knowing what it was.
 *
 * Grouping into steps is the store's job (see store.recordTile): one mouse
 * gesture or one synchronous action = one step.
 */

function tileKey(x, y, z) {
  return `${x},${y},${z}`;
}

function cloneTile(tile) {
  return tile ? tile.map(cloneEntry) : [];
}

function sameTile(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function createHistory(map, { limit = 200 } = {}) {
  const undoStack = [];
  const redoStack = [];
  let pending = null; // Map<key, { x, y, z, before }> while a step is being recorded

  function isRecording() {
    return pending !== null;
  }

  /** Remembers a tile's current content, once per step. */
  function record(x, y, z) {
    pending ??= new Map();
    const key = tileKey(x, y, z);
    if (!pending.has(key)) pending.set(key, { x, y, z, before: cloneTile(map.getTile(x, y, z)) });
  }

  /** Closes the current step; returns true if it changed anything. */
  function commit() {
    if (!pending) return false;
    const changes = [];
    for (const { x, y, z, before } of pending.values()) {
      const after = cloneTile(map.getTile(x, y, z));
      if (!sameTile(before, after)) changes.push({ x, y, z, before, after });
    }
    pending = null;
    if (changes.length === 0) return false;
    undoStack.push(changes);
    if (undoStack.length > limit) undoStack.shift();
    redoStack.length = 0;
    return true;
  }

  /** Writes a set of tile contents back; returns the floors that were touched. */
  function apply(changes, field) {
    const floors = new Set();
    for (const change of changes) {
      map.setTile(change.x, change.y, change.z, cloneTile(change[field]));
      floors.add(change.z);
    }
    return floors;
  }

  function undo() {
    const step = undoStack.pop();
    if (!step) return null;
    redoStack.push(step);
    return apply(step, 'before');
  }

  function redo() {
    const step = redoStack.pop();
    if (!step) return null;
    undoStack.push(step);
    return apply(step, 'after');
  }

  function clear() {
    undoStack.length = 0;
    redoStack.length = 0;
    pending = null;
  }

  return {
    record,
    commit,
    undo,
    redo,
    clear,
    isRecording,
    get undoDepth() {
      return undoStack.length;
    },
    get redoDepth() {
      return redoStack.length;
    },
  };
}
