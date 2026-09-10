import { reactive, shallowRef, computed } from '../vendor/vue.esm-browser.prod.js';

/**
 * Central, framework-light state container for the map editor.
 *
 * Kept free of any canvas/DOM knowledge on purpose: it only owns data and
 * the rules for mutating it, so it stays easy to reason about and to unit
 * test in isolation from rendering concerns.
 */
export function createStore(config) {
  // Sparse floor -> row -> col -> [{ id }, ...] structure - each entry is its
  // own object (not just a bare catalog id) so a placed instance can carry
  // more than its type later (rotation, custom data, ...). Left as a plain
  // object (not reactive) since it is only ever read/written imperatively
  // by the canvas renderer, never bound directly into a template.
  const mapData = {};

  // Image objects are large and non-serializable; shallowRef keeps Vue from
  // trying to deep-proxy them while still letting components react to the
  // list being (re)loaded.
  const items = shallowRef([]);

  const state = reactive({
    loading: true,
    loadError: null,
    layers: [],
    selectedLayer: null,
    selectedTool: 'pointer',
    selectedItemId: null,
    secondaryItemId: null,
    highlightedItem: null, // { itemId, x, y, z }
    brushSize: 1,
    currentFloor: 0,
    cursorPosition: { x: 0, y: 0 },
    renderFromX: 0,
    renderFromY: 0,
    shiftDown: false,
    tabDown: false,
    showHelp: false,
    selection: null, // { z, x1, y1, x2, y2 } - rectangular, restricted to a single floor
    clipboard: null, // { width, height, cells } - cells keyed "dx,dy" -> [itemId, ...], floor-agnostic
    contextMenu: null, // { screenX, screenY, itemId, x, y, z } - right-click menu for the topmost item on a tile
    itemProperties: null, // { itemId, x, y, z } - "Properties" dialog for a specific placed item
  });

  function getItem(id) {
    if (id === null || id === undefined) return null;
    const key = String(id);
    return items.value.find((item) => item.id === key) ?? null;
  }

  function getTile(x, y, z) {
    return mapData[z]?.[y]?.[x] ?? null;
  }

  function ensureTile(x, y, z) {
    mapData[z] ??= {};
    mapData[z][y] ??= {};
    mapData[z][y][x] ??= [];
    return mapData[z][y][x];
  }

  function pruneTile(x, y, z) {
    const tile = mapData[z]?.[y]?.[x];
    if (!tile || tile.length > 0) return;
    delete mapData[z][y][x];
    if (Object.keys(mapData[z][y]).length === 0) delete mapData[z][y];
    if (Object.keys(mapData[z]).length === 0) delete mapData[z];
  }

  /** A fresh placed instance of a catalog item, as stored in a tile's stack. */
  function createMapItem(itemId) {
    return { id: Number(itemId) };
  }

  /** Copies a map item so two tiles never end up sharing (and accidentally co-mutating) the same instance. */
  function cloneMapItem(entry) {
    return { ...entry };
  }

  const selectedItem = computed(() => getItem(state.selectedItemId));
  const secondaryItem = computed(() => getItem(state.secondaryItemId));

  const itemsByLayer = computed(() => {
    const grouped = {};
    for (const item of items.value) {
      (grouped[item.layer] ??= []).push(item);
    }
    return grouped;
  });

  function loadItemImage(raw) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ ...raw, id: String(raw.id), src: image.src, image });
      image.onerror = () => reject(new Error(`Failed to decode image for item ${raw.id}`));
      image.src = `data:image/png;base64,${raw.image}`;
    });
  }

  async function loadItems() {
    state.loading = true;
    state.loadError = null;
    try {
      const response = await fetch(`${config.itemsUrl}?v=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.json();
      items.value = await Promise.all(raw.map(loadItemImage));
      state.layers = [...new Set(items.value.map((item) => item.layer))];
      state.selectedLayer = state.layers[0] ?? null;
    } catch (error) {
      state.loadError = error;
      throw error;
    } finally {
      state.loading = false;
    }
  }

  function selectTool(name) {
    state.selectedTool = name;
    state.highlightedItem = null;
  }

  function selectItem(id) {
    if (!getItem(id)) return;
    state.selectedItemId = String(id);
  }

  /** Like selectItem, but also switches the palette to that item's layer, so callers (sampler, "Wybierz") can jump straight to it. */
  function selectItemAndReveal(id) {
    const item = getItem(id);
    if (!item) return;
    state.selectedItemId = item.id;
    state.selectedLayer = item.layer;
  }

  function selectSecondaryItem(id) {
    if (!getItem(id)) return;
    state.secondaryItemId = String(id);
  }

  function swapItems() {
    const { selectedItemId, secondaryItemId } = state;
    if (secondaryItemId) state.selectedItemId = secondaryItemId;
    if (selectedItemId) state.secondaryItemId = selectedItemId;
  }

  function setBrushSize(size) {
    if (size < 1 || size > 4) return;
    state.brushSize = size;
  }

  function setCurrentFloor(z) {
    if (z < config.minFloor || z > config.maxFloor) return;
    state.currentFloor = z;
    state.highlightedItem = null;
  }

  function pan(dx, dy) {
    if (dx !== 0) {
      const next = state.renderFromX + dx;
      if (next < 0) return;
      state.renderFromX = next;
    }
    if (dy !== 0) {
      const next = state.renderFromY + dy;
      if (next < 0) return;
      state.renderFromY = next;
    }
  }

  /** Returns true when the position actually changed, so callers can skip redundant redraws. */
  function setCursorPosition(x, y) {
    if (state.cursorPosition.x === x && state.cursorPosition.y === y) return false;
    state.cursorPosition = { x, y };
    return true;
  }

  /**
   * Places an item on a tile, replacing any existing item of the same layer
   * there (dropping leftover duplicates of it) and putting ground items at
   * the bottom of the stack. Used by drawOnTile - painting a new item is
   * expected to take over its layer's spot.
   */
  function placeItemOnTile(x, y, z, itemId) {
    const item = getItem(itemId);
    if (!item || x < 0 || y < 0 || z < config.minFloor || z > config.maxFloor) return;

    const tile = ensureTile(x, y, z);

    const sameLayerIndex = tile.findIndex((entry) => getItem(entry.id)?.layer === item.layer);
    if (sameLayerIndex !== -1) {
      for (let i = tile.length - 1; i > sameLayerIndex; i--) {
        if (getItem(tile[i].id)?.layer === item.layer) tile.splice(i, 1);
      }
      tile[sameLayerIndex] = createMapItem(itemId);
      return;
    }

    if (item.layer === 'ground') {
      tile.unshift(createMapItem(itemId));
    } else {
      tile.push(createMapItem(itemId));
    }
  }

  /**
   * Inserts an already-built map item entry onto a tile's stack (ground
   * items at the bottom, others on top) without touching whatever else is
   * already there - unlike placeItemOnTile, it never removes an existing
   * same-layer item. Used to drop a dragged item: moving something onto a
   * tile shouldn't delete unrelated content that happens to share its
   * layer, and it must keep whatever properties the moved entry carries
   * (not just its catalog id).
   */
  function insertEntryOnTile(x, y, z, entry) {
    const item = getItem(entry.id);
    if (!item || x < 0 || y < 0 || z < config.minFloor || z > config.maxFloor) return;

    const tile = ensureTile(x, y, z);
    if (item.layer === 'ground') {
      tile.unshift(entry);
    } else {
      tile.push(entry);
    }
  }

  function drawOnTile(x, y, z) {
    const item = selectedItem.value;
    if (!item || x < 0 || y < 0 || z < config.minFloor || z > config.maxFloor) return;

    // Holding shift allows stacking a second item of the same layer; it is
    // a one-shot allowance, consumed by the very next tile that gets drawn.
    if (state.shiftDown) {
      state.shiftDown = false;
      ensureTile(x, y, z).push(createMapItem(item.id));
      return;
    }

    placeItemOnTile(x, y, z, item.id);
  }

  function eraseOnTile(x, y, z, hardClear = false) {
    const tile = getTile(x, y, z);
    if (!tile || tile.length === 0) return;

    const topItem = getItem(tile[tile.length - 1].id);
    if (!hardClear && topItem?.layer === 'ground' && !state.highlightedItem) return;

    if (hardClear) {
      tile.length = 0;
    } else {
      tile.pop();
    }

    pruneTile(x, y, z);
  }

  function highlightOnTile(x, y, z) {
    const tile = getTile(x, y, z);
    if (!tile || tile.length === 0) return;
    state.highlightedItem = { itemId: tile[tile.length - 1].id, x, y, z };
  }

  function clearHighlight() {
    state.highlightedItem = null;
  }

  /** Opens the right-click context menu for the topmost item on a tile; closes it (rather than leaving a stale one) if the tile is empty. */
  function openContextMenu(screenX, screenY, x, y, z) {
    const tile = getTile(x, y, z);
    if (!tile || tile.length === 0) {
      state.contextMenu = null;
      return;
    }
    state.contextMenu = { screenX, screenY, itemId: tile[tile.length - 1].id, x, y, z };
  }

  function closeContextMenu() {
    state.contextMenu = null;
  }

  function openItemProperties(itemId, x, y, z) {
    state.itemProperties = { itemId, x, y, z };
  }

  function closeItemProperties() {
    state.itemProperties = null;
  }

  function beginSelection(x, y, z) {
    state.selection = { z, x1: x, y1: y, x2: x, y2: y };
  }

  function updateSelection(anchorX, anchorY, x, y) {
    if (!state.selection) return;
    state.selection = {
      z: state.selection.z,
      x1: Math.min(anchorX, x),
      y1: Math.min(anchorY, y),
      x2: Math.max(anchorX, x),
      y2: Math.max(anchorY, y),
    };
  }

  function clearSelection() {
    state.selection = null;
  }

  function isInsideSelection(x, y, z) {
    const s = state.selection;
    return !!s && s.z === z && x >= s.x1 && x <= s.x2 && y >= s.y1 && y <= s.y2;
  }

  /** Deep-copies the items in a rectangular area into a floor-agnostic block, keyed by offset from its top-left corner. */
  function snapshotArea(x1, y1, x2, y2, z) {
    const cells = {};
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const tile = getTile(x, y, z);
        if (tile && tile.length > 0) {
          cells[`${x - x1},${y - y1}`] = tile.map(cloneMapItem);
        }
      }
    }
    return { width: x2 - x1 + 1, height: y2 - y1 + 1, cells };
  }

  function clearArea(x1, y1, x2, y2, z) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const tile = getTile(x, y, z);
        if (!tile) continue;
        tile.length = 0;
        pruneTile(x, y, z);
      }
    }
    if (state.highlightedItem?.z === z) {
      const h = state.highlightedItem;
      if (h.x >= x1 && h.x <= x2 && h.y >= y1 && h.y <= y2) clearHighlight();
    }
  }

  /** Stamps a block (from snapshotArea/clipboard) onto the map, replacing each covered tile wholesale - including clearing tiles the source had empty. */
  function stampArea(originX, originY, z, block) {
    if (z < config.minFloor || z > config.maxFloor) return;
    for (let dy = 0; dy < block.height; dy++) {
      for (let dx = 0; dx < block.width; dx++) {
        const x = originX + dx;
        const y = originY + dy;
        if (x < 0 || y < 0) continue;
        const source = block.cells[`${dx},${dy}`];
        if (source && source.length > 0) {
          const tile = ensureTile(x, y, z);
          tile.length = 0;
          tile.push(...source.map(cloneMapItem));
        } else {
          const tile = getTile(x, y, z);
          if (tile) {
            tile.length = 0;
            pruneTile(x, y, z);
          }
        }
      }
    }
  }

  function copySelection() {
    const s = state.selection;
    if (!s) return;
    state.clipboard = snapshotArea(s.x1, s.y1, s.x2, s.y2, s.z);
  }

  function pasteClipboard(atX, atY, z) {
    if (!state.clipboard) return;
    stampArea(atX, atY, z, state.clipboard);
    state.selection = {
      z,
      x1: atX,
      y1: atY,
      x2: atX + state.clipboard.width - 1,
      y2: atY + state.clipboard.height - 1,
    };
  }

  /** Grabs the current selection's content for the "pointer" tool to drag around, clearing it from its original spot immediately. Returns null if there is no selection. */
  function beginMoveSelection() {
    const s = state.selection;
    if (!s) return null;
    const block = snapshotArea(s.x1, s.y1, s.x2, s.y2, s.z);
    clearArea(s.x1, s.y1, s.x2, s.y2, s.z);
    return { block, z: s.z, originalX1: s.x1, originalY1: s.y1 };
  }

  /** Drops a block captured by beginMoveSelection() at its new position and moves the selection to follow it. */
  function finishMoveSelection(draft, targetX1, targetY1) {
    stampArea(targetX1, targetY1, draft.z, draft.block);
    state.selection = {
      z: draft.z,
      x1: targetX1,
      y1: targetY1,
      x2: targetX1 + draft.block.width - 1,
      y2: targetY1 + draft.block.height - 1,
    };
  }

  /**
   * Grabs the single topmost (highlighted) item on a tile for the "pointer"
   * tool to drag&drop, clearing it from its original spot immediately.
   * Returns the same { block, z, originalX1, originalY1 } shape as
   * beginMoveSelection() so both share the same drag-preview rendering;
   * only the drop behaviour differs (see finishItemMove). Returns null if
   * the tile is empty.
   */
  function beginItemMove(x, y, z) {
    const tile = getTile(x, y, z);
    if (!tile || tile.length === 0) return null;

    const entry = tile.pop(); // the actual entry, moved (not cloned) so any of its properties travel with it
    pruneTile(x, y, z);

    const h = state.highlightedItem;
    if (h && h.x === x && h.y === y && h.z === z) clearHighlight();

    return { block: { width: 1, height: 1, cells: { '0,0': [entry] } }, z, originalX1: x, originalY1: y };
  }

  /**
   * Drops an item grabbed by beginItemMove() at its new position. Uses
   * insertEntryOnTile (add, don't replace) so dropping onto an occupied
   * tile never deletes an existing item of the same layer, and keeps the
   * moved entry exactly as it was (not just re-created from its catalog id).
   *
   * Only a drop back onto the original tile highlights the item - that is
   * what a plain click (press and release without moving) boils down to.
   * An actual move leaves nothing highlighted, so the "lifted" glow does
   * not linger on the item at its new spot.
   */
  function finishItemMove(draft, targetX, targetY) {
    const x = Math.max(targetX, 0);
    const y = Math.max(targetY, 0);
    const [entry] = draft.block.cells['0,0'];
    insertEntryOnTile(x, y, draft.z, entry);

    if (x === draft.originalX1 && y === draft.originalY1) {
      highlightOnTile(x, y, draft.z);
    } else {
      clearHighlight();
    }
  }

  function newMap() {
    for (const key of Object.keys(mapData)) delete mapData[key];
    state.renderFromX = 0;
    state.renderFromY = 0;
    clearHighlight();
    clearSelection();
    closeContextMenu();
    closeItemProperties();
    state.clipboard = null;
  }

  function openMap(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        let parsed;
        try {
          parsed = JSON.parse(event.target.result);
        } catch {
          reject(new Error('Selected file is not a valid map editor file'));
          return;
        }
        for (const key of Object.keys(mapData)) delete mapData[key];
        Object.assign(mapData, parsed);
        state.renderFromX = 0;
        state.renderFromY = 0;
        clearHighlight();
        clearSelection();
        closeContextMenu();
        closeItemProperties();
        state.clipboard = null;
        resolve();
      };
      reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
      reader.readAsText(file);
    });
  }

  function saveMap() {
    const blob = new Blob([JSON.stringify(mapData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'map.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  return {
    state,
    items,
    selectedItem,
    secondaryItem,
    itemsByLayer,
    getItem,
    getTile,
    loadItems,
    selectTool,
    selectItem,
    selectItemAndReveal,
    selectSecondaryItem,
    swapItems,
    setBrushSize,
    setCurrentFloor,
    pan,
    setCursorPosition,
    drawOnTile,
    eraseOnTile,
    highlightOnTile,
    clearHighlight,
    openContextMenu,
    closeContextMenu,
    openItemProperties,
    closeItemProperties,
    beginSelection,
    updateSelection,
    clearSelection,
    isInsideSelection,
    copySelection,
    pasteClipboard,
    beginMoveSelection,
    finishMoveSelection,
    beginItemMove,
    finishItemMove,
    newMap,
    openMap,
    saveMap,
  };
}
