import { reactive, shallowRef, computed } from '../vendor/vue.esm-browser.prod.js';
import { createMapData, cellKey } from './mapData.js';
import { createHistory } from './history.js';
import {
  BLANK_ITEM_PNG,
  EMPTY_CATALOG,
  createCatalog,
  decodeItem,
  itemToRaw,
  loadCatalog,
  normalizeLight,
  normalizeTraits,
} from './catalog.js';
import { isValidRespawnPoint } from './mapFile.js';

// Keys of a placed map entry that belong to the editor itself; everything
// else on the entry is a user-defined property (see setEntryProperty).
const RESERVED_ENTRY_KEYS = new Set(['id']);

export const MIN_BRUSH_SIZE = 1;
export const MAX_BRUSH_SIZE = 4;
// View scale steps, largest first. 1 is the sprites' native size and also the
// upper limit: the editor only ever zooms out, never blows pixel art up.
export const ZOOM_LEVELS = [1, 0.75, 0.5, 0.25];

/**
 * Normalizes a user-typed property key into camelCase: "Door ID", "door_id",
 * "door-id" and "DoorID" all become "doorId". Returns an empty string when
 * nothing usable is left (e.g. only punctuation or digits were typed).
 */
export function toCamelCase(raw) {
  const words = String(raw)
    .replace(/[^0-9A-Za-z]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words
    .map((word, index) => (index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase()))
    .join('')
    .replace(/^[0-9]+/, '');
}

/**
 * Central state container for the map editor: reactive UI state plus the
 * editing rules on top of the (non-reactive) map data and item catalog.
 *
 * Kept free of any canvas/DOM knowledge on purpose. Nothing here triggers
 * a redraw directly; instead every mutation of the map bumps
 * `state.mapRevision` (see touchFloor/touchAll) and the renderer watches
 * that, together with the view-related fields of `state`, to schedule a
 * frame. Adding a new action therefore never requires remembering to
 * repaint - mutate the map through the helpers below and the screen follows.
 *
 * The same helpers also feed undo/redo: call recordTile() before changing
 * a tile and the change becomes undoable. Mutations made synchronously by
 * one action collapse into one undo step; a mouse gesture (press to
 * release) is one step too, see beginGesture/endGesture.
 */
export function createStore(config) {
  const map = createMapData();
  const history = createHistory(map);

  // The catalog holds decoded Image objects - large and non-serializable -
  // so it is a shallowRef: components react to the whole thing being
  // (re)loaded without Vue deep-proxying every item.
  const catalog = shallowRef(EMPTY_CATALOG);

  const state = reactive({
    loading: true,
    loadError: null,
    name: config.name, // map name, saved in the file envelope
    respawnPoint: [...config.respawnPoint], // [x, y, z] - where the view centers after new/open
    viewport: { width: 0, height: 0 }, // map canvas size in px, reported by the renderer
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
    zoom: 1, // view scale, one of ZOOM_LEVELS
    shiftDown: false,
    selection: null, // { z, x1, y1, x2, y2 } - rectangular, restricted to a single floor
    clipboard: null, // { width, height, cells } - cells keyed "dx,dy" -> [entry, ...], floor-agnostic
    contextMenu: null, // { screenX, screenY, itemId, x, y, z } - right-click menu for the topmost item on a tile
    dialog: null, // { name, props } - the one modal dialog that can be open at a time (see components/App.js and MapEditor.js)
    itemsDirty: false, // the item catalog was edited and items.json has not been saved since
    mapRevision: 0, // bumped on every map mutation; the renderer's cue to repaint floors
    undoDepth: 0, // mirrors history for the UI (undo/redo buttons, menu items)
    redoDepth: 0,
  });

  /* ---- invalidation ------------------------------------------------- */

  const dirty = { all: false, floors: new Set() };

  function touchFloor(z) {
    dirty.floors.add(z);
    state.mapRevision++;
  }

  function touchAll() {
    dirty.all = true;
    state.mapRevision++;
  }

  /** Hands the floors changed since the last call to the renderer and forgets them. */
  function takeDirtyFloors() {
    const result = { all: dirty.all, floors: [...dirty.floors] };
    dirty.all = false;
    dirty.floors.clear();
    return result;
  }

  /* ---- undo / redo ----------------------------------------------------- */

  let gestureOpen = false;
  let autoCommitScheduled = false;

  function syncHistoryState() {
    state.undoDepth = history.undoDepth;
    state.redoDepth = history.redoDepth;
  }

  function commitHistory() {
    autoCommitScheduled = false;
    if (gestureOpen) return;
    if (history.commit()) syncHistoryState();
  }

  /**
   * Marks a tile as about to change. Outside a gesture the step closes
   * itself in a microtask, i.e. once the current action has finished all
   * its synchronous mutations.
   */
  function recordTile(x, y, z) {
    history.record(x, y, z);
    if (!gestureOpen && !autoCommitScheduled) {
      autoCommitScheduled = true;
      queueMicrotask(commitHistory);
    }
  }

  /** Records every tile a rectangle covers (empty ones included - stamping may fill them). */
  function recordArea(x1, y1, x2, y2, z) {
    for (let y = Math.max(y1, 0); y <= y2; y++) {
      for (let x = Math.max(x1, 0); x <= x2; x++) recordTile(x, y, z);
    }
  }

  /** Groups every mutation until endGesture() into one undo step (mouse press to release). */
  function beginGesture() {
    gestureOpen = true;
  }

  function endGesture() {
    if (!gestureOpen) return;
    gestureOpen = false;
    commitHistory();
  }

  function isGestureOpen() {
    return gestureOpen;
  }

  function applyHistory(floors) {
    if (!floors) return false;
    for (const z of floors) touchFloor(z);
    clearHighlight();
    syncHistoryState();
    return true;
  }

  function undo() {
    if (gestureOpen) return false;
    return applyHistory(history.undo());
  }

  function redo() {
    if (gestureOpen) return false;
    return applyHistory(history.redo());
  }

  /* ---- catalog -------------------------------------------------------- */

  const layers = computed(() => catalog.value.layers);
  const itemsByLayer = computed(() => catalog.value.byLayer);
  const selectedItem = computed(() => getItem(state.selectedItemId));
  const secondaryItem = computed(() => getItem(state.secondaryItemId));

  function getItem(id) {
    return catalog.value.get(id);
  }

  /**
   * How many px the entry at `index` of a tile stack is lifted by the
   * items under it: the sum of their `altitude` (catalog field, px). A
   * lifted sprite is drawn that much further up and left, so a tall
   * bottom item visibly carries whatever gets stacked on top of it. With
   * no index, returns the elevation of the next item put on the stack.
   * The total is capped at `config.maxAltitude`.
   */
  function stackAltitude(entries, index = entries.length) {
    let altitude = 0;
    for (let i = 0; i < index; i++) altitude += getItem(entries[i].id)?.altitude ?? 0;
    return Math.min(altitude, config.maxAltitude);
  }

  async function loadItems() {
    state.loading = true;
    state.loadError = null;
    try {
      catalog.value = await loadCatalog(config.itemsUrl);
      state.selectedLayer = catalog.value.layers[0] ?? null;
      state.itemsDirty = false;
    } catch (error) {
      state.loadError = error;
      throw error;
    } finally {
      state.loading = false;
    }
  }

  /* ---- editing the item catalog ---------------------------------------- */

  /**
   * Swaps in a catalog built from an edited item list. The catalog is
   * replaced rather than mutated in place: that re-indexes it, re-runs the
   * computeds the palette and the item list read, and is what the renderer
   * watches to redraw the map with the new names, layers and altitudes.
   */
  function replaceCatalogItems(items) {
    catalog.value = createCatalog(items);
    // An edit can empty a layer out of existence (or invent a new one), so
    // the palette's layer may no longer be one the catalog has.
    if (!catalog.value.layers.includes(state.selectedLayer)) state.selectedLayer = catalog.value.layers[0] ?? null;
    state.itemsDirty = true;
  }

  /** The lowest free id above every id in use, as a string. */
  function nextItemId() {
    let highest = -1;
    for (const item of catalog.value.items) highest = Math.max(highest, Number(item.id));
    return String(highest + 1);
  }

  /**
   * Writes changed fields onto a catalog item. `patch` takes the same
   * fields items.json has (id, name, layer, altitude, traits, light,
   * png); the
   * caller is expected to have validated them. Returns false when the item
   * is gone or the new id is taken - the two things a caller cannot fix by
   * formatting its input differently.
   *
   * Renumbering an item does not touch the map: entries already placed
   * keep the old id and stop resolving, which is why the editor warns
   * about it rather than the store trying to rewrite the map.
   */
  function updateItem(id, patch) {
    const current = getItem(id);
    if (!current) return false;

    const next = { ...current, ...patch };
    next.id = String(next.id);
    next.traits = normalizeTraits(next.traits);
    next.light = normalizeLight(next.light);
    if (next.id !== current.id && getItem(next.id)) return false;

    replaceCatalogItems(catalog.value.items.map((item) => (item === current ? next : item)));
    if (state.selectedItemId === current.id) state.selectedItemId = next.id;
    if (state.secondaryItemId === current.id) state.secondaryItemId = next.id;
    return true;
  }

  /** Replaces an item's sprite with a base64 PNG; rejects when it cannot be decoded. */
  async function setItemImage(id, png) {
    const current = getItem(id);
    if (!current) return false;
    const decoded = await decodeItem({ ...itemToRaw(current), image: png });
    return updateItem(id, { png: decoded.png, src: decoded.src, image: decoded.image });
  }

  /** Adds an empty item on the given layer (the palette's by default) and returns its id. */
  async function addItem(layer = state.selectedLayer) {
    const item = await decodeItem({
      id: nextItemId(),
      name: 'new item',
      layer: layer ?? 'ground',
      altitude: 0,
      traits: [],
      light: null,
      image: BLANK_ITEM_PNG,
    });
    replaceCatalogItems([...catalog.value.items, item]);
    return item.id;
  }

  /** Drops an item from the catalog; copies already placed on the map stop resolving and are no longer drawn. */
  function removeItem(id) {
    const item = getItem(id);
    if (!item) return false;
    replaceCatalogItems(catalog.value.items.filter((other) => other !== item));
    if (state.selectedItemId === item.id) state.selectedItemId = null;
    if (state.secondaryItemId === item.id) state.secondaryItemId = null;
    return true;
  }

  /** The catalog as items.json content (see itemsFile.serializeItems). */
  function exportItems() {
    return catalog.value.items;
  }

  function markItemsSaved() {
    state.itemsDirty = false;
  }

  /* ---- selection of tool / items --------------------------------------- */

  function selectTool(name) {
    state.selectedTool = name;
    state.highlightedItem = null;
  }

  function selectItem(id) {
    if (!getItem(id)) return;
    state.selectedItemId = String(id);
  }

  /** Like selectItem, but also switches the palette to that item's layer, so callers (sampler, context menu) can jump straight to it. */
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
    if (size < MIN_BRUSH_SIZE || size > MAX_BRUSH_SIZE) return;
    state.brushSize = size;
  }

  /* ---- view ------------------------------------------------------------ */

  function isValidFloor(z) {
    return z >= config.minFloor && z <= config.maxFloor;
  }

  function setCurrentFloor(z) {
    if (!isValidFloor(z)) return;
    state.currentFloor = z;
    state.highlightedItem = null;
  }

  function setViewportSize(width, height) {
    if (state.viewport.width === width && state.viewport.height === height) return;
    state.viewport = { width, height };
  }

  function clampFloor(z) {
    return Math.min(config.maxFloor, Math.max(config.minFloor, Math.round(z)));
  }

  /**
   * Shows floor z scrolled so that tile (x, y) sits in the middle of the
   * viewport. Every pan step moves the view by exactly one tile (whether
   * it is eating into a floor's parallax margin or revealing new tiles,
   * see pointer.js), so the pan amount that puts a tile at column c is
   * simply `x + baseOffset - c`.
   */
  function centerOn(x, y, z) {
    setCurrentFloor(clampFloor(z));
    const baseOffset = config.maxFloor - state.currentFloor;
    const centerCol = Math.floor(state.viewport.width / tilePx() / 2);
    const centerRow = Math.floor(state.viewport.height / tilePx() / 2);
    state.renderFromX = Math.max(0, Math.round(x) + baseOffset - centerCol);
    state.renderFromY = Math.max(0, Math.round(y) + baseOffset - centerRow);
  }

  /** On-screen size of one tile in px at the current zoom. */
  function tilePx() {
    return config.tileSize * state.zoom;
  }

  /** Switches to a zoom level, keeping whatever was in the middle of the viewport there. */
  function setZoom(zoom) {
    if (!ZOOM_LEVELS.includes(zoom) || zoom === state.zoom) return;
    const centerCol = state.renderFromX + Math.floor(state.viewport.width / tilePx() / 2);
    const centerRow = state.renderFromY + Math.floor(state.viewport.height / tilePx() / 2);
    state.zoom = zoom;
    state.renderFromX = Math.max(0, centerCol - Math.floor(state.viewport.width / tilePx() / 2));
    state.renderFromY = Math.max(0, centerRow - Math.floor(state.viewport.height / tilePx() / 2));
  }

  /** Steps through ZOOM_LEVELS: +1 zooms in (towards native size), -1 zooms out. */
  function stepZoom(direction) {
    const index = ZOOM_LEVELS.indexOf(state.zoom) - direction;
    if (index < 0 || index >= ZOOM_LEVELS.length) return;
    setZoom(ZOOM_LEVELS[index]);
  }

  function canZoom(direction) {
    const index = ZOOM_LEVELS.indexOf(state.zoom) - direction;
    return index >= 0 && index < ZOOM_LEVELS.length;
  }

  function centerOnRespawn() {
    const [x, y, z] = state.respawnPoint;
    centerOn(x, y, z);
  }

  /** Scrolls the view by whole tiles; each axis stops at the map edge on its own, so a diagonal pan still moves along the free axis. */
  function pan(dx, dy) {
    state.renderFromX = Math.max(0, state.renderFromX + dx);
    state.renderFromY = Math.max(0, state.renderFromY + dy);
  }

  /** Returns true when the position actually changed, so callers can skip redundant work. */
  function setCursorPosition(x, y) {
    if (state.cursorPosition.x === x && state.cursorPosition.y === y) return false;
    state.cursorPosition = { x, y };
    return true;
  }

  /* ---- tiles ------------------------------------------------------------ */

  function getTile(x, y, z) {
    return map.getTile(x, y, z);
  }

  function isValidPosition(x, y, z) {
    return x >= 0 && y >= 0 && isValidFloor(z);
  }

  /** A fresh placed instance of a catalog item, as stored in a tile's stack. */
  function createEntry(itemId) {
    return { id: Number(itemId) };
  }

  /** Puts an entry on a tile's stack: ground items at the bottom, everything else on top. */
  function pushEntry(tile, entry, layer) {
    if (layer === 'ground') tile.unshift(entry);
    else tile.push(entry);
  }

  /**
   * Places an item on a tile, replacing any existing item of the same layer
   * there (dropping leftover duplicates of it). Painting a new item is
   * expected to take over its layer's spot.
   */
  function placeItemOnTile(x, y, z, itemId) {
    const item = getItem(itemId);
    if (!item || !isValidPosition(x, y, z)) return;

    recordTile(x, y, z);
    const tile = map.ensureTile(x, y, z);
    const sameLayerIndex = tile.findIndex((entry) => getItem(entry.id)?.layer === item.layer);
    if (sameLayerIndex !== -1) {
      for (let i = tile.length - 1; i > sameLayerIndex; i--) {
        if (getItem(tile[i].id)?.layer === item.layer) tile.splice(i, 1);
      }
      tile[sameLayerIndex] = createEntry(itemId);
    } else {
      pushEntry(tile, createEntry(itemId), item.layer);
    }
    touchFloor(z);
  }

  /**
   * Inserts an already-built entry onto a tile without touching whatever
   * else is there - unlike placeItemOnTile, it never removes an existing
   * same-layer item. Used to drop a dragged item: moving something onto a
   * tile shouldn't delete unrelated content, and the entry keeps whatever
   * properties it carries.
   */
  function insertEntryOnTile(x, y, z, entry) {
    const item = getItem(entry.id);
    if (!item || !isValidPosition(x, y, z)) return;
    recordTile(x, y, z);
    pushEntry(map.ensureTile(x, y, z), entry, item.layer);
    touchFloor(z);
  }

  function drawOnTile(x, y, z) {
    const item = selectedItem.value;
    if (!item || !isValidPosition(x, y, z)) return;

    // Holding shift allows stacking a second item of the same layer; it is
    // a one-shot allowance, consumed by the very next tile that gets drawn.
    if (state.shiftDown) {
      state.shiftDown = false;
      recordTile(x, y, z);
      map.ensureTile(x, y, z).push(createEntry(item.id));
      touchFloor(z);
      return;
    }

    placeItemOnTile(x, y, z, item.id);
  }

  function eraseOnTile(x, y, z, hardClear = false) {
    const tile = getTile(x, y, z);
    if (!tile || tile.length === 0) return;

    const topItem = getItem(tile[tile.length - 1].id);
    if (!hardClear && topItem?.layer === 'ground' && !state.highlightedItem) return;

    recordTile(x, y, z);
    if (hardClear) tile.length = 0;
    else tile.pop();

    map.pruneTile(x, y, z);
    touchFloor(z);
  }

  function highlightOnTile(x, y, z) {
    const tile = getTile(x, y, z);
    if (!tile || tile.length === 0) return;
    state.highlightedItem = { itemId: tile[tile.length - 1].id, x, y, z };
  }

  function clearHighlight() {
    state.highlightedItem = null;
  }

  /* ---- context menu & dialogs ------------------------------------------- */

  /** Opens the right-click context menu for the topmost item on a tile; closes it (rather than leaving a stale one) if the tile is empty. */
  function openContextMenu(screenX, screenY, x, y, z) {
    const tile = getTile(x, y, z);
    state.contextMenu =
      tile && tile.length > 0 ? { screenX, screenY, itemId: tile[tile.length - 1].id, x, y, z } : null;
  }

  function closeContextMenu() {
    state.contextMenu = null;
  }

  function openDialog(name, props = {}) {
    state.dialog = { name, props };
  }

  function closeDialog() {
    state.dialog = null;
  }

  function toggleDialog(name, props = {}) {
    if (state.dialog?.name === name) closeDialog();
    else openDialog(name, props);
  }

  /* ---- entry properties ------------------------------------------------- */

  /** The topmost placed instance of `itemId` on a tile - the one the context menu and the properties dialog are about. */
  function getPlacedEntry(x, y, z, itemId) {
    const tile = getTile(x, y, z);
    if (!tile) return null;
    const key = String(itemId);
    for (let i = tile.length - 1; i >= 0; i--) {
      if (String(tile[i].id) === key) return tile[i];
    }
    return null;
  }

  /** User-defined [key, value] pairs stored on a placed entry, i.e. everything on it apart from the editor's own keys. */
  function getEntryProperties(entry) {
    return Object.entries(entry).filter(([key]) => !RESERVED_ENTRY_KEYS.has(key));
  }

  function hasEntryProperties(entry) {
    return Object.keys(entry).some((key) => !RESERVED_ENTRY_KEYS.has(key));
  }

  /**
   * Stores a custom property straight on the placed entry (next to its id),
   * so it travels with the entry through moves, copy/paste and the map file
   * without any extra bookkeeping. The key is camelCased first; returns
   * false when it ends up empty or reserved, or the entry is gone.
   */
  function setEntryProperty(x, y, z, itemId, rawKey, value) {
    const entry = getPlacedEntry(x, y, z, itemId);
    const key = toCamelCase(rawKey);
    if (!entry || !key || RESERVED_ENTRY_KEYS.has(key)) return false;
    recordTile(x, y, z);
    entry[key] = value;
    touchFloor(z);
    return true;
  }

  function removeEntryProperty(x, y, z, itemId, key) {
    const entry = getPlacedEntry(x, y, z, itemId);
    if (!entry || RESERVED_ENTRY_KEYS.has(key)) return false;
    recordTile(x, y, z);
    delete entry[key];
    touchFloor(z);
    return true;
  }

  /* ---- selection, clipboard, moving --------------------------------------- */

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

  function selectBlock(x1, y1, z, block) {
    state.selection = { z, x1, y1, x2: x1 + block.width - 1, y2: y1 + block.height - 1 };
  }

  function clearArea(x1, y1, x2, y2, z) {
    map.forEachTile(z, x1, y1, x2, y2, (tile, x, y) => recordTile(x, y, z));
    map.clear(x1, y1, x2, y2, z);
    const h = state.highlightedItem;
    if (h && h.z === z && h.x >= x1 && h.x <= x2 && h.y >= y1 && h.y <= y2) clearHighlight();
    touchFloor(z);
  }

  function stampArea(originX, originY, z, block) {
    if (!isValidFloor(z)) return;
    recordArea(originX, originY, originX + block.width - 1, originY + block.height - 1, z);
    map.stamp(originX, originY, z, block);
    touchFloor(z);
  }

  function copySelection() {
    const s = state.selection;
    if (!s) return;
    state.clipboard = map.snapshot(s.x1, s.y1, s.x2, s.y2, s.z);
  }

  function pasteClipboard(atX, atY, z) {
    if (!state.clipboard) return;
    stampArea(atX, atY, z, state.clipboard);
    selectBlock(atX, atY, z, state.clipboard);
  }

  /** Grabs the current selection's content for the "pointer" tool to drag around, clearing it from its original spot immediately. Returns null if there is no selection. */
  function beginMoveSelection() {
    const s = state.selection;
    if (!s) return null;
    const block = map.snapshot(s.x1, s.y1, s.x2, s.y2, s.z);
    clearArea(s.x1, s.y1, s.x2, s.y2, s.z);
    clearHighlight(); // see beginItemMove - a drag takes over from any earlier highlight
    return { block, z: s.z, originalX1: s.x1, originalY1: s.y1 };
  }

  /** Drops a block captured by beginMoveSelection() at its new position and moves the selection to follow it. */
  function finishMoveSelection(draft, targetX1, targetY1) {
    stampArea(targetX1, targetY1, draft.z, draft.block);
    selectBlock(targetX1, targetY1, draft.z, draft.block);
  }

  /**
   * Grabs the single topmost item on a tile for the "pointer" tool to
   * drag&drop, clearing it from its original spot immediately. Returns the
   * same { block, z, originalX1, originalY1 } shape as beginMoveSelection()
   * so both share the same drag-preview rendering; only the drop behaviour
   * differs (see finishItemMove). Returns null if the tile is empty.
   */
  function beginItemMove(x, y, z) {
    const tile = getTile(x, y, z);
    if (!tile || tile.length === 0) return null;

    recordTile(x, y, z);
    const entry = tile.pop(); // moved, not cloned, so its properties travel with it
    map.pruneTile(x, y, z);
    // Grabbing anything ends the previous highlight, wherever it was - only
    // the item being dragged should draw attention now.
    clearHighlight();
    touchFloor(z);

    return { block: { width: 1, height: 1, cells: { [cellKey(0, 0)]: [entry] } }, z, originalX1: x, originalY1: y };
  }

  /**
   * Drops an item grabbed by beginItemMove() at its new position. Uses
   * insertEntryOnTile (add, don't replace) so dropping onto an occupied
   * tile never deletes an existing item of the same layer.
   *
   * Only a drop back onto the original tile highlights the item, as if it
   * had just been clicked. An actual move leaves nothing highlighted, so
   * the highlight glow does not linger on the item at its new spot.
   */
  function finishItemMove(draft, targetX, targetY) {
    const x = Math.max(targetX, 0);
    const y = Math.max(targetY, 0);
    const [entry] = draft.block.cells[cellKey(0, 0)];
    insertEntryOnTile(x, y, draft.z, entry);

    if (x === draft.originalX1 && y === draft.originalY1) highlightOnTile(x, y, draft.z);
    else clearHighlight();
  }

  /* ---- whole-map operations --------------------------------------------- */

  function hasMapContent() {
    return !map.isEmpty();
  }

  function setMapName(name) {
    state.name = String(name);
  }

  function setRespawnPoint(point) {
    if (!isValidRespawnPoint(point)) return false;
    state.respawnPoint = [point[0], point[1], clampFloor(point[2])];
    return true;
  }

  /** Resets everything that refers to map content and centers on the respawn point - shared by "new" and "open". */
  function resetView() {
    centerOnRespawn();
    state.clipboard = null;
    clearHighlight();
    clearSelection();
    closeContextMenu();
    closeDialog();
    history.clear();
    syncHistoryState();
    touchAll();
  }

  function newMap() {
    map.reset();
    setMapName(config.name);
    setRespawnPoint(config.respawnPoint);
    resetView();
  }

  /** Replaces the map with a validated file envelope (see mapFile.readMapFile); missing fields fall back to the config defaults. */
  function loadMapFile({ name = config.name, respawnPoint = config.respawnPoint, map: data }) {
    map.replace(data);
    setMapName(name);
    setRespawnPoint(respawnPoint);
    resetView();
  }

  /** The file envelope as saved to disk. */
  function exportMapFile() {
    return { name: state.name, respawnPoint: [...state.respawnPoint], map: map.toJSON() };
  }

  return {
    state,
    catalog,
    layers,
    itemsByLayer,
    selectedItem,
    secondaryItem,
    takeDirtyFloors,
    beginGesture,
    endGesture,
    isGestureOpen,
    undo,
    redo,
    getItem,
    stackAltitude,
    loadItems,
    updateItem,
    setItemImage,
    addItem,
    removeItem,
    exportItems,
    markItemsSaved,
    selectTool,
    selectItem,
    selectItemAndReveal,
    selectSecondaryItem,
    swapItems,
    setBrushSize,
    setCurrentFloor,
    setViewportSize,
    centerOn,
    centerOnRespawn,
    pan,
    tilePx,
    setZoom,
    stepZoom,
    canZoom,
    setCursorPosition,
    getTile,
    forEachTile: map.forEachTile,
    drawOnTile,
    eraseOnTile,
    highlightOnTile,
    clearHighlight,
    openContextMenu,
    closeContextMenu,
    openDialog,
    closeDialog,
    toggleDialog,
    getPlacedEntry,
    getEntryProperties,
    hasEntryProperties,
    setEntryProperty,
    removeEntryProperty,
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
    hasMapContent,
    setMapName,
    setRespawnPoint,
    newMap,
    loadMapFile,
    exportMapFile,
  };
}
