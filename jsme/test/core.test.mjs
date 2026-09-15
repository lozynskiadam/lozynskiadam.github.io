import './harness.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { cellKey, parseCellKey, cloneEntry, createMapData, isValidMapData } from '../src/core/mapData.js';
import { createHistory } from '../src/core/history.js';
import {
  createCatalog,
  decodeItem,
  isGroundItem,
  isHexColor,
  itemToRaw,
  normalizeLight,
  normalizeTraits,
  searchItems,
  DEFAULT_LIGHT,
} from '../src/core/catalog.js';
import {
  allShortcutsLabel,
  formatShortcut,
  normalizeShortcut,
  primaryShortcutLabel,
  shortcutFromEvent,
  shortcutsOf,
} from '../src/core/shortcuts.js';
import { isValidMapFile, isValidRespawnPoint, mapFileName } from '../src/core/mapFile.js';
import { borderItemIds, borderPlan, createTerrain, isUsableTerrain, terrainToRaw } from '../src/core/terrains.js';
import { serializeTerrains } from '../src/core/terrainsFile.js';
import { marginTiles, pixelToTile, tileToPixel, visibleOrigin } from '../src/core/pointer.js';

/* ---- mapData ---------------------------------------------------------- */

test('cell keys round-trip', () => {
  assert.equal(cellKey(2, 3), '2,3');
  assert.deepEqual(parseCellKey('2,3'), [2, 3]);
  assert.deepEqual(parseCellKey(cellKey(-1, 0)), [-1, 0]);
});

test('cloneEntry copies rather than shares', () => {
  const entry = { id: 1, doorId: 'a' };
  const copy = cloneEntry(entry);
  copy.doorId = 'b';
  assert.equal(entry.doorId, 'a');
});

test('tiles are created on demand and pruned away when emptied', () => {
  const map = createMapData();
  assert.equal(map.getTile(1, 1, 0), null);
  assert.ok(map.isEmpty());

  map.ensureTile(1, 1, 0).push({ id: 5 });
  assert.equal(map.getTile(1, 1, 0).length, 1);
  assert.ok(!map.isEmpty());

  map.clearTile(1, 1, 0);
  assert.equal(map.getTile(1, 1, 0), null);
  assert.ok(map.isEmpty(), 'the emptied row and floor go with the tile');
});

test('setTile replaces content and an empty list removes the tile', () => {
  const map = createMapData();
  map.setTile(0, 0, 0, [{ id: 1 }, { id: 2 }]);
  assert.deepEqual(map.getTile(0, 0, 0), [{ id: 1 }, { id: 2 }]);
  map.setTile(0, 0, 0, []);
  assert.equal(map.getTile(0, 0, 0), null);
});

test('forEachTile only visits non-empty tiles inside the rectangle', () => {
  const map = createMapData();
  map.setTile(1, 1, 0, [{ id: 1 }]);
  map.setTile(5, 5, 0, [{ id: 2 }]);
  const seen = [];
  map.forEachTile(0, 0, 0, 2, 2, (_tile, x, y) => seen.push([x, y]));
  assert.deepEqual(seen, [[1, 1]]);
});

test('snapshot deep-copies and stamp overwrites whole tiles', () => {
  const map = createMapData();
  map.setTile(1, 1, 0, [{ id: 7, doorId: 'x' }]);
  const block = map.snapshot(1, 1, 2, 2, 0);
  assert.equal(block.width, 2);
  assert.equal(block.height, 2);

  block.cells[cellKey(0, 0)][0].doorId = 'changed';
  assert.equal(map.getTile(1, 1, 0)[0].doorId, 'x', 'the snapshot is not a live view');

  map.setTile(10, 10, 0, [{ id: 99 }]);
  map.stamp(10, 10, 0, block);
  assert.equal(map.getTile(10, 10, 0)[0].id, 7);
  assert.equal(map.getTile(11, 11, 0), null, 'a cell the block has empty clears the target');
});

test('isValidMapData rejects anything that is not floor/row/column/stack', () => {
  assert.ok(isValidMapData({}));
  assert.ok(isValidMapData({ 0: { 1: { 2: [{ id: 3 }] } } }));
  assert.ok(!isValidMapData(null));
  assert.ok(!isValidMapData([]));
  assert.ok(!isValidMapData({ 0: { 1: { 2: 'nope' } } }));
  assert.ok(!isValidMapData({ 0: { 1: { 2: [{ id: 'nope' }] } } }));
});

/* ---- history ---------------------------------------------------------- */

test('a step is only kept when it changed something', () => {
  const map = createMapData();
  const history = createHistory(map);

  history.record(0, 0, 0);
  assert.equal(history.commit(), false, 'recording without changing anything is not a step');

  history.record(0, 0, 0);
  map.setTile(0, 0, 0, [{ id: 1 }]);
  assert.equal(history.commit(), true);
  assert.equal(history.undoDepth, 1);
});

test('undo and redo put the remembered tiles back', () => {
  const map = createMapData();
  const history = createHistory(map);

  history.record(0, 0, 0);
  map.setTile(0, 0, 0, [{ id: 1 }]);
  history.commit();

  assert.deepEqual([...history.undo()], [0], 'undo reports the floors it touched');
  assert.equal(map.getTile(0, 0, 0), null);
  assert.equal(history.redoDepth, 1);

  history.redo();
  assert.deepEqual(map.getTile(0, 0, 0), [{ id: 1 }]);
  assert.equal(history.undo.length >= 0, true);
});

test('a new step drops the redo stack, and the undo stack is bounded', () => {
  const map = createMapData();
  const history = createHistory(map, { limit: 2 });

  for (const id of [1, 2, 3]) {
    history.record(0, 0, 0);
    map.setTile(0, 0, 0, [{ id }]);
    history.commit();
  }
  assert.equal(history.undoDepth, 2, 'the oldest step fell off the limit');

  history.undo();
  assert.equal(history.redoDepth, 1);
  history.record(1, 1, 0);
  map.setTile(1, 1, 0, [{ id: 9 }]);
  history.commit();
  assert.equal(history.redoDepth, 0, 'a fresh edit invalidates redo');
});

test('undo and redo on an empty stack report nothing', () => {
  const history = createHistory(createMapData());
  assert.equal(history.undo(), null);
  assert.equal(history.redo(), null);
});

/* ---- catalog ---------------------------------------------------------- */

test('traits are filtered to the known set, in canonical order, without duplicates', () => {
  assert.deepEqual(normalizeTraits(['blockingCreatures', 'nonsense', 'ground', 'ground']), [
    'ground',
    'blockingCreatures',
  ]);
  assert.deepEqual(normalizeTraits(undefined), []);
  assert.ok(isGroundItem({ traits: ['ground'] }));
  assert.ok(!isGroundItem({ traits: [] }));
  assert.ok(!isGroundItem(null));
});

test('light keeps the item lit and falls back per broken field', () => {
  assert.equal(normalizeLight(null), null);
  assert.deepEqual(normalizeLight({ level: 5, color: '#FFAA00' }), { level: 5, color: '#ffaa00' });
  assert.deepEqual(normalizeLight({ color: 'rgb(1,2,3)' }), DEFAULT_LIGHT);
  assert.equal(normalizeLight({ level: 0, color: '#ffa500' }).level, DEFAULT_LIGHT.level);
});

test('isHexColor accepts only #rrggbb', () => {
  assert.ok(isHexColor('#ffa500'));
  assert.ok(isHexColor('#FFA500'));
  assert.ok(!isHexColor('#fa5'));
  assert.ok(!isHexColor('orange'));
});

test('a catalog is sorted by id, split by layer and looks up by string or number', () => {
  const catalog = createCatalog([
    { id: '10', name: 'b', layer: 'ground', traits: [], light: null },
    { id: '2', name: 'a', layer: 'wall', traits: [], light: null },
  ]);
  assert.deepEqual(catalog.items.map((item) => item.id), ['2', '10']);
  assert.deepEqual(catalog.layers, ['wall', 'ground']);
  assert.equal(catalog.get(2).name, 'a');
  assert.equal(catalog.get('2').name, 'a');
  assert.equal(catalog.get(null), null);
  assert.equal(catalog.get(999), null);
});

test('search matches name or id, case-insensitively', () => {
  const items = [
    { id: '1', name: 'Green Grass' },
    { id: '42', name: 'crate' },
  ];
  assert.equal(searchItems(items, 'grass').length, 1);
  assert.equal(searchItems(items, '42').length, 1);
  assert.equal(searchItems(items, '   ').length, 2, 'a blank needle filters nothing');
});

test('decodeItem splits the file image into png/src/bitmap, and itemToRaw puts it back', async () => {
  const raw = {
    id: 7,
    name: 'crate',
    layer: 'building',
    elevation: 8,
    offsetX: 4,
    offsetY: 2,
    traits: ['movable'],
    light: null,
    image: 'AA==',
  };
  const item = await decodeItem(raw);
  assert.equal(item.id, '7', 'catalog ids are strings');
  assert.equal(item.png, 'AA==');
  assert.ok(item.bitmap, 'the decoded sprite is `bitmap`');
  assert.equal(item.src, 'data:image/png;base64,AA==');
  assert.deepEqual(itemToRaw(item), { ...raw, id: '7' });
});

test('an item with no offsets in the file sits flush on its tile', async () => {
  const item = await decodeItem({ id: '1', name: 'grass', layer: 'ground', elevation: 0, traits: [], light: null, image: 'AA==' });
  assert.equal(item.offsetX, 0);
  assert.equal(item.offsetY, 0);
});

/* ---- shortcuts -------------------------------------------------------- */

test('shortcut notation normalizes to a canonical lookup key', () => {
  assert.equal(normalizeShortcut('Ctrl+S'), 'ctrl+s');
  assert.equal(normalizeShortcut('Ctrl+Shift+Z'), 'ctrl+shift+z');
  assert.equal(normalizeShortcut('Shift+Ctrl+Z'), 'ctrl+shift+z', 'modifier order does not matter');
  assert.equal(normalizeShortcut('+'), '+');
  assert.equal(normalizeShortcut('Ctrl++'), 'ctrl++');
});

test('a KeyboardEvent maps onto the same key, with Meta counting as Ctrl', () => {
  const event = (init) => ({ altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, ...init });
  assert.equal(shortcutFromEvent(event({ key: 'S', ctrlKey: true })), 'ctrl+s');
  assert.equal(shortcutFromEvent(event({ key: 's', metaKey: true })), 'ctrl+s');
  assert.equal(shortcutFromEvent(event({ key: 'Z', ctrlKey: true, shiftKey: true })), 'ctrl+shift+z');
  assert.equal(shortcutFromEvent(event({ key: 'X', shiftKey: true })), 'x', 'bare Shift is a mode, not a modifier');
});

test('shortcuts are listed and labelled for the UI', () => {
  assert.deepEqual(shortcutsOf({ shortcut: 'Ctrl+S' }), ['Ctrl+S']);
  assert.deepEqual(shortcutsOf({}), []);
  assert.equal(formatShortcut('Ctrl+PageUp'), 'Ctrl+PgUp');
  assert.equal(primaryShortcutLabel({ shortcut: ['ArrowUp', 'W'] }), '↑');
  assert.equal(allShortcutsLabel({ shortcut: ['ArrowUp', 'W'] }), '↑ / W');
  assert.equal(primaryShortcutLabel({}), '');
});

/* ---- map file --------------------------------------------------------- */

test('the envelope is validated field by field', () => {
  assert.ok(isValidRespawnPoint([1, 2, 3]));
  assert.ok(!isValidRespawnPoint([1, 2]));
  assert.ok(!isValidRespawnPoint([1, 2, NaN]));

  assert.ok(isValidMapFile({ name: 'x', respawnPoint: [0, 0, 0], map: {} }));
  assert.ok(!isValidMapFile({ respawnPoint: [0, 0, 0], map: {} }));
  assert.ok(!isValidMapFile({ name: 'x', respawnPoint: [0, 0, 0], map: [] }));
});

test('the download name is slugged from the map name', () => {
  assert.equal(mapFileName('My Town!'), 'my-town.json');
  assert.equal(mapFileName('  '), 'map.json');
});

/* ---- pointer math ----------------------------------------------------- */

test('panning eats a floor margin before it reveals new tiles', () => {
  assert.equal(marginTiles(3, 0), 3);
  assert.equal(visibleOrigin(3, 0), 0);
  assert.equal(marginTiles(3, 2), 1, 'two pan steps shrank the margin');
  assert.equal(visibleOrigin(3, 2), 0, '...without moving the first visible tile');
  assert.equal(marginTiles(3, 5), 0);
  assert.equal(visibleOrigin(3, 5), 2, 'past the margin, panning reveals tiles');
});

test('tile and pixel conversions are inverses', () => {
  const [origin, marginPx, tileSize] = [4, 32, 32];
  assert.equal(tileToPixel(6, origin, marginPx, tileSize), 96);
  assert.equal(pixelToTile(96, origin, marginPx, tileSize), 6);
  assert.equal(pixelToTile(127, origin, marginPx, tileSize), 6, 'anywhere inside the tile');
});

/* ---- terrain patterns ------------------------------------------------- */

/** Neighbours as borderPlan takes them: everything false but the directions named. */
const around = (...directions) =>
  Object.fromEntries(['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map((d) => [d, directions.includes(d)]));

const slots = (pieces) => pieces.map(({ group, slot }) => `${group}.${slot}`);

test('a pattern keeps every slot whatever the file left out', () => {
  const terrain = createTerrain({ id: 3, name: 'grass', groundId: 1000, outer: { n: 2101, nonsense: 7 } });
  assert.equal(terrain.groundId, '1000', 'ids are strings, like the catalog\'s');
  assert.equal(terrain.outer.n, '2101');
  assert.equal(terrain.outer.s, null, 'an unfilled slot is null, not missing');
  assert.deepEqual(Object.keys(terrain.inner), ['nw', 'ne', 'sw', 'se']);
  assert.ok(!('nonsense' in terrain.outer));
  const written = JSON.parse(serializeTerrains([terrain]))[0];
  assert.deepEqual(terrainToRaw(terrain), written, 'and it round-trips through the file');
});

test('a pattern is only usable once it has a ground and a piece', () => {
  assert.ok(!isUsableTerrain(createTerrain({ groundId: 1000 })));
  assert.ok(!isUsableTerrain(createTerrain({ outer: { n: 2101 } })));
  assert.ok(isUsableTerrain(createTerrain({ groundId: 1000, outer: { n: 2101 } })));
  assert.deepEqual([...borderItemIds(createTerrain({ outer: { n: 2101 }, inner: { nw: 2111 } }))], ['2101', '2111']);
});

test('a tile beside a terrain gets the piece for the side it is on', () => {
  assert.deepEqual(slots(borderPlan(around('s'))), ['outer.n'], 'terrain to the south, so this is its north edge');
  assert.deepEqual(slots(borderPlan(around('w'))), ['outer.e']);
  assert.deepEqual(
    slots(borderPlan(around('n', 'e'), (group) => group === 'outer')),
    ['outer.s', 'outer.w'],
    'one piece per side, named after the side of the terrain it sits on',
  );
});

test('a diagonal neighbour alone is a convex corner - and is dropped once a side covers it', () => {
  assert.deepEqual(slots(borderPlan(around('se'))), ['outer.nw']);
  assert.deepEqual(slots(borderPlan(around('se', 's'))), ['outer.n'], 'the north edge already runs past that corner');
});

test('two sides meeting make one inner corner instead of two edges', () => {
  assert.deepEqual(slots(borderPlan(around('s', 'e'))), ['inner.nw']);
  assert.deepEqual(slots(borderPlan(around('n', 'w'))), ['inner.se']);
  const notches = slots(borderPlan(around('s', 'e', 'w')));
  assert.deepEqual(notches, ['inner.nw', 'inner.ne'], 'both notches, and no south edge left between them');
  assert.deepEqual(
    slots(borderPlan(around('n', 'e', 's', 'w'))),
    ['inner.nw', 'inner.ne', 'inner.sw', 'inner.se'],
    'a tile left as a hole in the terrain is fringed all the way round',
  );
});

test('an unfilled inner corner falls back to the two edges it would have replaced', () => {
  const has = (group) => group === 'outer';
  assert.deepEqual(slots(borderPlan(around('s', 'e'), has)), ['outer.w', 'outer.n']);
});

test('a tile with no terrain around it needs nothing', () => {
  assert.deepEqual(borderPlan(around()), []);
});
