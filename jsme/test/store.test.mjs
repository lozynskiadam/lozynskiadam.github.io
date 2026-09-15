import './harness.mjs';
import { responses } from './harness.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createStore, toCamelCase } from '../src/core/store.js';

const CONFIG = { itemsUrl: 'items.json', mapUrl: 'default-map.json', terrainsUrl: 'terrains.json', tileSize: 32, maxElevation: 64, maxLightLevel: 16, minFloor: -7, maxFloor: 7 };

const ITEMS = [
  { id: '1', name: 'grass', layer: 'ground', elevation: 0, traits: ['ground'], light: null, image: 'AA==' },
  { id: '2', name: 'crate', layer: 'building', elevation: 8, traits: ['movable'], light: null, image: 'AA==' },
  { id: '3', name: 'barrel', layer: 'building', elevation: 4, traits: [], light: null, image: 'AA==' },
  { id: '4', name: 'bush', layer: 'nature', elevation: 0, traits: [], light: null, image: 'AA==' },
];

// A terrain pattern over the fixture catalog: grass (1) as the ground and
// one edge item per slot, numbered so a piece is recognizable by its id.
const EDGE_SLOTS = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se', 'inw', 'ine', 'isw', 'ise'];
const EDGE_ITEMS = Object.fromEntries(EDGE_SLOTS.map((slot, index) => [slot, String(10 + index)]));

const TERRAIN = {
  id: '0',
  name: 'grass',
  groundId: '1',
  outer: {
    nw: EDGE_ITEMS.nw,
    n: EDGE_ITEMS.n,
    ne: EDGE_ITEMS.ne,
    w: EDGE_ITEMS.w,
    e: EDGE_ITEMS.e,
    sw: EDGE_ITEMS.sw,
    s: EDGE_ITEMS.s,
    se: EDGE_ITEMS.se,
  },
  inner: { nw: EDGE_ITEMS.inw, ne: EDGE_ITEMS.ine, sw: EDGE_ITEMS.isw, se: EDGE_ITEMS.ise },
};

const EDGE_CATALOG = Object.values(EDGE_ITEMS).map((id) => ({
  id,
  name: `grass edge ${id}`,
  layer: 'edge',
  elevation: 0,
  traits: [],
  light: null,
  image: 'AA==',
}));

// A second pattern, so a test can watch two terrains meet: its own ground
// item and its own edge ids, again one per slot.
const SAND_EDGE_ITEMS = Object.fromEntries(EDGE_SLOTS.map((slot, index) => [slot, String(30 + index)]));

const SAND_GROUND = { id: '5', name: 'sand', layer: 'ground', elevation: 0, traits: ['ground'], light: null, image: 'AA==' };

const SAND_TERRAIN = {
  id: '1',
  name: 'sand',
  groundId: SAND_GROUND.id,
  outer: {
    nw: SAND_EDGE_ITEMS.nw,
    n: SAND_EDGE_ITEMS.n,
    ne: SAND_EDGE_ITEMS.ne,
    w: SAND_EDGE_ITEMS.w,
    e: SAND_EDGE_ITEMS.e,
    sw: SAND_EDGE_ITEMS.sw,
    s: SAND_EDGE_ITEMS.s,
    se: SAND_EDGE_ITEMS.se,
  },
  inner: { nw: SAND_EDGE_ITEMS.inw, ne: SAND_EDGE_ITEMS.ine, sw: SAND_EDGE_ITEMS.isw, se: SAND_EDGE_ITEMS.ise },
};

const SAND_EDGE_CATALOG = Object.values(SAND_EDGE_ITEMS).map((id) => ({
  id,
  name: `sand edge ${id}`,
  layer: 'edge',
  elevation: 0,
  traits: [],
  light: null,
  image: 'AA==',
}));

/** A store with the fixture catalog loaded, ready to paint on. */
async function freshStore() {
  responses['items.json'] = ITEMS;
  const store = createStore(CONFIG);
  await store.loadItems();
  return store;
}

/** The same store with the grass pattern loaded from terrains.json, so the brush fringes what it paints. */
async function terrainStore() {
  responses['items.json'] = [...ITEMS, ...EDGE_CATALOG];
  responses['terrains.json'] = [TERRAIN];
  const store = createStore(CONFIG);
  await store.loadItems();
  await store.loadTerrains();
  store.selectItem('1');
  return store;
}

/**
 * A store with two patterns that can meet: grass (ground 1, edges 10-21)
 * and sand (ground 5, edges 30-41). `order` is the precedence order the
 * file lists them in, first one highest.
 */
async function twoTerrainStore(order = [TERRAIN, SAND_TERRAIN]) {
  responses['items.json'] = [...ITEMS, SAND_GROUND, ...EDGE_CATALOG, ...SAND_EDGE_CATALOG];
  responses['terrains.json'] = order;
  const store = createStore(CONFIG);
  await store.loadItems();
  await store.loadTerrains();
  return store;
}

const ids = (tile) => (tile ?? []).map((entry) => entry.id);

/* ---- erasing: the ground rule ----------------------------------------- */

test('a 1x1 eraser takes the top item but leaves the ground', async () => {
  const store = await freshStore();
  store.selectItem('1');
  store.drawOnTile(0, 0, 0);
  store.selectItem('2');
  store.drawOnTile(0, 0, 0);
  assert.deepEqual(ids(store.getTile(0, 0, 0)), [1, 2]);

  store.eraseOnTile(0, 0, 0);
  assert.deepEqual(ids(store.getTile(0, 0, 0)), [1], 'the crate went');

  store.eraseOnTile(0, 0, 0);
  assert.deepEqual(ids(store.getTile(0, 0, 0)), [1], 'the ground stayed');
});

test('force removes the ground - what Delete and the context menu do', async () => {
  const store = await freshStore();
  store.selectItem('1');
  store.drawOnTile(0, 0, 0);

  store.eraseOnTile(0, 0, 0, { force: true });
  assert.equal(store.getTile(0, 0, 0), null);
});

test('wholeStack clears the tile outright, ground included', async () => {
  const store = await freshStore();
  for (const id of ['1', '2']) {
    store.selectItem(id);
    store.drawOnTile(0, 0, 0);
  }
  store.eraseOnTile(0, 0, 0, { wholeStack: true });
  assert.equal(store.getTile(0, 0, 0), null, 'a brush wider than one tile wipes everything');
});

test('a highlight on some other tile does not unlock the ground rule', async () => {
  const store = await freshStore();
  store.selectItem('1');
  store.drawOnTile(0, 0, 0);
  store.drawOnTile(5, 5, 0);

  // The pointer tool leaves a highlight wherever it was last clicked.
  store.highlightOnTile(5, 5, 0);
  store.eraseOnTile(0, 0, 0);
  assert.deepEqual(ids(store.getTile(0, 0, 0)), [1], 'erasing elsewhere is still refused');
});

test('erasing an empty tile is a no-op', async () => {
  const store = await freshStore();
  store.eraseOnTile(3, 3, 0);
  assert.equal(store.state.undoDepth, 0, 'and records no undo step');
});

/* ---- painting --------------------------------------------------------- */

test('the brush takes over its own layer and leaves other layers alone', async () => {
  const store = await freshStore();
  store.selectItem('2');
  store.drawOnTile(0, 0, 0);
  store.selectItem('4');
  store.drawOnTile(0, 0, 0);
  store.selectItem('3');
  store.drawOnTile(0, 0, 0);

  assert.deepEqual(ids(store.getTile(0, 0, 0)), [3, 4], 'the barrel replaced the crate on "building"');
});

test('ground items sink to the bottom of the stack', async () => {
  const store = await freshStore();
  store.selectItem('2');
  store.drawOnTile(0, 0, 0);
  store.selectItem('1');
  store.drawOnTile(0, 0, 0);

  assert.deepEqual(ids(store.getTile(0, 0, 0)), [1, 2]);
});

test('a held Shift stacks a second item of the same layer, once', async () => {
  const store = await freshStore();
  store.selectItem('2');
  store.drawOnTile(0, 0, 0);
  store.state.shiftDown = true;
  store.selectItem('3');
  store.drawOnTile(0, 0, 0);
  assert.deepEqual(ids(store.getTile(0, 0, 0)), [2, 3], 'both building items are there');
  assert.equal(store.state.shiftDown, false, 'the allowance was consumed');

  store.selectItem('2');
  store.drawOnTile(0, 0, 0);
  assert.deepEqual(ids(store.getTile(0, 0, 0)), [2], 'and the next stroke replaces again');
});

test('painting outside the map or above/below the floor range is refused', async () => {
  const store = await freshStore();
  store.selectItem('2');
  store.drawOnTile(-1, 0, 0);
  store.drawOnTile(0, 0, 99);
  assert.equal(store.getTile(-1, 0, 0), null);
  assert.equal(store.getTile(0, 0, 99), null);
});

test('stack elevation is the sum underneath, capped by config', async () => {
  const store = await freshStore();
  const tile = [{ id: 2 }, { id: 3 }];
  assert.equal(store.stackElevation(tile, 0), 0);
  assert.equal(store.stackElevation(tile, 1), 8);
  assert.equal(store.stackElevation(tile), 12);
  assert.equal(store.stackElevation(Array.from({ length: 20 }, () => ({ id: 2 }))), CONFIG.maxElevation);
});

test('a sprite sits in the bottom-right of its tile, moved up-left by the lift and its own offsets', async () => {
  const store = await freshStore();
  const sprite = { bitmap: { width: 24, height: 16 } };
  assert.deepEqual(store.itemDrawPosition(sprite, 64, 96), { x: 72, y: 112 }, 'no lift, no offsets');
  assert.deepEqual(store.itemDrawPosition(sprite, 64, 96, 8), { x: 64, y: 104 }, 'the stack under it lifts it up-left');
  assert.deepEqual(
    store.itemDrawPosition({ ...sprite, offsetX: 4, offsetY: 2 }, 64, 96),
    { x: 68, y: 110 },
    'its own offsets move it further left and up',
  );
  assert.deepEqual(
    store.itemDrawPosition({ ...sprite, offsetX: -4, offsetY: -2 }, 64, 96),
    { x: 76, y: 114 },
    'a negative offset pushes it right and down',
  );
});

/* ---- undo / redo ------------------------------------------------------ */

test('one action is one undo step, and a gesture groups every stroke in it', async () => {
  const store = await freshStore();
  store.selectItem('2');

  store.drawOnTile(0, 0, 0);
  await Promise.resolve();
  assert.equal(store.state.undoDepth, 1);

  store.beginGesture();
  store.drawOnTile(1, 0, 0);
  store.drawOnTile(2, 0, 0);
  store.drawOnTile(3, 0, 0);
  assert.equal(store.state.undoDepth, 1, 'nothing is committed mid-gesture');
  store.endGesture();
  assert.equal(store.state.undoDepth, 2, 'the whole stroke is one step');

  store.undo();
  assert.equal(store.getTile(1, 0, 0), null);
  assert.equal(store.getTile(2, 0, 0), null);
  assert.deepEqual(ids(store.getTile(0, 0, 0)), [2], 'the earlier step is untouched');

  store.redo();
  assert.deepEqual(ids(store.getTile(3, 0, 0)), [2]);
});

test('undo is refused mid-gesture', async () => {
  const store = await freshStore();
  store.selectItem('2');
  store.drawOnTile(0, 0, 0);
  await Promise.resolve();
  store.beginGesture();
  assert.equal(store.undo(), false);
  store.endGesture();
  assert.equal(store.undo(), true);
});

test('entry properties are undoable too', async () => {
  const store = await freshStore();
  store.selectItem('2');
  store.drawOnTile(0, 0, 0);
  await Promise.resolve();

  assert.ok(store.setEntryProperty(0, 0, 0, 2, 'Door ID', '7'));
  await Promise.resolve();
  assert.deepEqual(store.getEntryProperties(store.getTile(0, 0, 0)[0]), [['doorId', '7']]);

  store.undo();
  assert.deepEqual(store.getEntryProperties(store.getTile(0, 0, 0)[0]), []);
});

test('a reserved or empty property key is refused', async () => {
  const store = await freshStore();
  store.selectItem('2');
  store.drawOnTile(0, 0, 0);
  assert.equal(store.setEntryProperty(0, 0, 0, 2, 'id', 'x'), false);
  assert.equal(store.setEntryProperty(0, 0, 0, 2, '---', 'x'), false);
  assert.equal(store.setEntryProperty(9, 9, 0, 2, 'ok', 'x'), false, 'and so is a tile with nothing on it');
});

/* ---- selection and clipboard ------------------------------------------ */

test('copy and paste move a block of tiles', async () => {
  const store = await freshStore();
  store.selectItem('2');
  store.drawOnTile(0, 0, 0);
  store.drawOnTile(1, 1, 0);

  store.beginSelection(0, 0, 0);
  store.updateSelection(0, 0, 1, 1);
  store.copySelection();
  store.pasteClipboard(10, 10, 0);

  assert.deepEqual(ids(store.getTile(10, 10, 0)), [2]);
  assert.deepEqual(ids(store.getTile(11, 11, 0)), [2]);
  assert.deepEqual(store.state.selection, { z: 0, x1: 10, y1: 10, x2: 11, y2: 11 }, 'the selection follows the paste');
});

test('deleting a selection wipes every tile in it, ground included, in one step', async () => {
  const store = await freshStore();
  store.selectItem('1'); // grass, a ground item the 1x1 eraser would leave alone
  for (const [x, y] of [[0, 0], [1, 0], [1, 1], [3, 3]]) store.drawOnTile(x, y, 0);
  await Promise.resolve();

  store.beginSelection(0, 0, 0);
  store.updateSelection(0, 0, 1, 1);
  assert.equal(store.deleteSelection(), true);
  await Promise.resolve();

  assert.equal(store.getTile(0, 0, 0), null);
  assert.equal(store.getTile(1, 1, 0), null);
  assert.deepEqual(ids(store.getTile(3, 3, 0)), [1], 'what was outside the selection stayed');
  assert.ok(store.state.selection, 'the selection itself stays, so a paste still lands there');

  store.undo();
  assert.deepEqual(ids(store.getTile(0, 0, 0)), [1], 'and the whole area comes back as one step');
  assert.deepEqual(ids(store.getTile(1, 1, 0)), [1]);
});

test('deleting with nothing selected reports as much, so Delete can fall back', async () => {
  const store = await freshStore();
  assert.equal(store.deleteSelection(), false);
});

test('a selection knows what is inside it', async () => {
  const store = await freshStore();
  store.beginSelection(2, 2, 0);
  store.updateSelection(2, 2, 4, 4);
  assert.ok(store.isInsideSelection(3, 3, 0));
  assert.ok(!store.isInsideSelection(5, 3, 0));
  assert.ok(!store.isInsideSelection(3, 3, 1), 'a selection belongs to one floor');
  store.clearSelection();
  assert.ok(!store.isInsideSelection(3, 3, 0));
});

/* ---- project fields --------------------------------------------------- */

test('the respawn point is validated and its floor clamped', async () => {
  const store = await freshStore();
  assert.equal(store.setRespawnPoint([1, 2]), false);
  assert.equal(store.setRespawnPoint(['a', 2, 0]), false);
  assert.ok(store.setRespawnPoint([1, 2, 99]));
  assert.deepEqual(store.state.respawnPoint, [1, 2, CONFIG.maxFloor]);
});

test('the exported envelope is what the file holds', async () => {
  const store = await freshStore();
  store.setMapName('My Town');
  store.setRespawnPoint([5, 6, 1]);
  store.selectItem('2');
  store.drawOnTile(0, 0, 0);

  const envelope = store.exportMapFile();
  assert.equal(envelope.name, 'My Town');
  assert.deepEqual(envelope.respawnPoint, [5, 6, 1]);
  assert.deepEqual(envelope.map[0][0][0], [{ id: 2 }]);
});

test('selectLayer folds the <select>\'s empty value into "all layers"', async () => {
  const store = await freshStore();
  store.selectLayer('building');
  assert.equal(store.state.selectedLayer, 'building');
  store.selectLayer('');
  assert.equal(store.state.selectedLayer, null, 'one sentinel, not two');
});

test('revealing an item switches the palette to its layer, unless it shows all of them', async () => {
  const store = await freshStore();
  store.selectLayer('ground');
  store.selectItemAndReveal(2);
  assert.equal(store.state.selectedItemId, '2');
  assert.equal(store.state.selectedLayer, 'building');

  store.selectLayer('');
  store.selectItemAndReveal(4);
  assert.equal(store.state.selectedLayer, null, '"all layers" is left alone');
});

/* ---- the catalog as edited by the items editor ------------------------- */

test('renumbering an item keeps the selection pointing at it', async () => {
  const store = await freshStore();
  store.selectItem('2');
  assert.ok(store.updateItem('2', { id: '99' }));
  assert.equal(store.state.selectedItemId, '99');
  assert.equal(store.getItem('2'), null);
  assert.ok(store.state.itemsDirty);
});

test('an id already in use is refused', async () => {
  const store = await freshStore();
  assert.equal(store.updateItem('2', { id: '3' }), false);
  assert.equal(store.updateItem('nope', { name: 'x' }), false);
});

test('a removed item drops out of the catalog and out of the selection', async () => {
  const store = await freshStore();
  store.selectItem('2');
  store.selectSecondaryItem('2');
  assert.ok(store.removeItem('2'));
  assert.equal(store.state.selectedItemId, null);
  assert.equal(store.state.secondaryItemId, null);
  assert.equal(store.removeItem('2'), false);
});

test('a new item takes the lowest free id', async () => {
  const store = await freshStore();
  const id = await store.addItem('ground');
  assert.equal(id, '5');
  assert.equal(store.getItem('5').layer, 'ground');
});

test('swapping exchanges the primary and secondary objects', async () => {
  const store = await freshStore();
  store.selectItem('2');
  store.selectSecondaryItem('3');
  store.swapItems();
  assert.equal(store.state.selectedItemId, '3');
  assert.equal(store.state.secondaryItemId, '2');
});

/* ---- misc ------------------------------------------------------------- */

test('property keys are camelCased whatever they were typed as', () => {
  assert.equal(toCamelCase('Door ID'), 'doorId');
  assert.equal(toCamelCase('door_id'), 'doorId');
  assert.equal(toCamelCase('door-id'), 'doorId');
  assert.equal(toCamelCase('DoorID'), 'doorId');
  assert.equal(toCamelCase('!!!'), '');
  assert.equal(toCamelCase('123'), '');
});

test('the zoom steps through its levels and reports when it cannot', async () => {
  const store = await freshStore();
  assert.equal(store.state.zoom, 1);
  assert.equal(store.canZoom(1), false, 'native size is the upper limit');
  store.stepZoom(-1);
  assert.equal(store.state.zoom, 0.75);
  assert.ok(store.canZoom(1));
  for (let i = 0; i < 5; i++) store.stepZoom(-1);
  assert.equal(store.state.zoom, 0.25);
  assert.equal(store.canZoom(-1), false);
});

test('the brush size stays inside its range', async () => {
  const store = await freshStore();
  store.setBrushSize(0);
  assert.equal(store.state.brushSize, 1);
  store.setBrushSize(4);
  assert.equal(store.state.brushSize, 4);
  store.setBrushSize(5);
  assert.equal(store.state.brushSize, 4);
});

test('the floor stays inside the configured range', async () => {
  const store = await freshStore();
  store.setCurrentFloor(CONFIG.maxFloor + 1);
  assert.equal(store.state.currentFloor, 0, 'an out-of-range floor is simply refused');
  store.setCurrentFloor(3);
  assert.equal(store.state.currentFloor, 3);
});

/* ---- terrain patterns -------------------------------------------------- */

test('the patterns come off terrains.json, and a missing file just means none', async () => {
  const store = await terrainStore();
  assert.equal(store.state.terrains.length, 1);
  assert.equal(store.getTerrain('0').name, 'grass');
  assert.equal(store.terrainForGround('1').id, '0', 'the ground item is what the brush recognizes');
  assert.equal(store.terrainForGround('2'), null);
  assert.equal(store.state.terrainsDirty, false);

  delete responses['terrains.json'];
  await store.loadTerrains();
  assert.deepEqual(store.state.terrains, []);
});

test('painting a terrain lays its edges on the tiles around it', async () => {
  const store = await terrainStore();
  store.drawOnTile(5, 5, 0);

  assert.deepEqual(ids(store.getTile(5, 5, 0)), [1], 'the painted tile is just the ground');
  assert.deepEqual(ids(store.getTile(5, 4, 0)), [Number(EDGE_ITEMS.n)], 'north of the terrain');
  assert.deepEqual(ids(store.getTile(5, 6, 0)), [Number(EDGE_ITEMS.s)]);
  assert.deepEqual(ids(store.getTile(4, 5, 0)), [Number(EDGE_ITEMS.w)]);
  assert.deepEqual(ids(store.getTile(6, 5, 0)), [Number(EDGE_ITEMS.e)]);
  assert.deepEqual(ids(store.getTile(4, 4, 0)), [Number(EDGE_ITEMS.nw)], 'and the four corners of the ring');
  assert.deepEqual(ids(store.getTile(6, 6, 0)), [Number(EDGE_ITEMS.se)]);
  assert.equal(store.getTile(5, 3, 0), null, 'nothing two tiles out');
});

test('a tile that becomes terrain drops the edges it was carrying', async () => {
  const store = await terrainStore();
  store.drawOnTile(5, 5, 0);
  assert.deepEqual(ids(store.getTile(6, 5, 0)), [Number(EDGE_ITEMS.e)]);

  store.drawOnTile(6, 5, 0);
  assert.deepEqual(ids(store.getTile(6, 5, 0)), [1], 'the piece went as the ground arrived');
  assert.deepEqual(ids(store.getTile(7, 5, 0)), [Number(EDGE_ITEMS.e)], 'and the ring moved out with it');
});

test('a tile with terrain on two sides gets one inner corner', async () => {
  const store = await terrainStore();
  store.drawOnTile(6, 5, 0);
  store.drawOnTile(5, 6, 0);
  assert.deepEqual(ids(store.getTile(5, 5, 0)), [Number(EDGE_ITEMS.inw)], 'terrain to the south and east');
});

test('edges land above the ground of the tile they fringe, under what stands on it', async () => {
  const store = await terrainStore();
  store.selectItem('2'); // a crate, layer "building"
  store.drawOnTile(5, 4, 0);
  store.selectItem('1');
  store.drawOnTile(5, 4, 0); // grass under the crate, so the tile is a terrain tile
  store.drawOnTile(5, 5, 0);

  assert.deepEqual(ids(store.getTile(5, 3, 0)), [Number(EDGE_ITEMS.n)]);
  store.selectItem('2');
  store.drawOnTile(5, 3, 0);
  assert.deepEqual(ids(store.getTile(5, 3, 0)), [Number(EDGE_ITEMS.n), 2], 'the crate stacks on top of the edge');
});

test('erasing the ground takes the edges around it away', async () => {
  const store = await terrainStore();
  store.drawOnTile(5, 5, 0);
  store.eraseOnTile(5, 5, 0, { force: true });

  for (const [x, y] of [[5, 4], [5, 6], [4, 5], [6, 5], [4, 4], [6, 6]]) {
    assert.equal(store.getTile(x, y, 0), null, `(${x}, ${y}) should be empty again`);
  }
});

test('erasing an edge by hand leaves it erased', async () => {
  const store = await terrainStore();
  store.drawOnTile(5, 5, 0);
  assert.deepEqual(store.eraseOnTile(5, 4, 0).map((entry) => entry.id), [Number(EDGE_ITEMS.n)]);
  assert.equal(store.getTile(5, 4, 0), null, 'removing a piece is taken at face value');
});

test('painting something that is no terrain leaves the edges alone', async () => {
  const store = await terrainStore();
  store.drawOnTile(5, 5, 0);
  store.selectItem('4'); // a bush, layer "nature"
  store.drawOnTile(5, 4, 0);
  assert.deepEqual(ids(store.getTile(5, 4, 0)), [Number(EDGE_ITEMS.n), 4]);
});

test('the ground and everything it fringed undo as one step', async () => {
  const store = await terrainStore();
  store.beginGesture();
  store.drawOnTile(5, 5, 0);
  store.drawOnTile(6, 5, 0);
  store.endGesture();
  assert.equal(store.state.undoDepth, 1);

  store.undo();
  for (const [x, y] of [[5, 5], [6, 5], [5, 4], [7, 5], [4, 4]]) {
    assert.equal(store.getTile(x, y, 0), null, `(${x}, ${y}) should be back to empty`);
  }
});

test('a half-filled pattern falls back to the edges it does have', async () => {
  const store = await terrainStore();
  store.updateTerrain('0', { inner: { nw: null } });
  store.drawOnTile(6, 5, 0);
  store.drawOnTile(5, 6, 0);
  assert.deepEqual(ids(store.getTile(5, 5, 0)), [Number(EDGE_ITEMS.w), Number(EDGE_ITEMS.n)]);
});

test('deleting a selection re-fringes the terrain left around it', async () => {
  const store = await terrainStore();
  store.beginGesture();
  for (const [x, y] of [[5, 5], [6, 5], [5, 6], [6, 6]]) store.drawOnTile(x, y, 0);
  store.endGesture();

  store.beginSelection(6, 5, 0);
  store.updateSelection(6, 5, 6, 6);
  store.deleteSelection();

  const east = [Number(EDGE_ITEMS.e)];
  assert.deepEqual(ids(store.getTile(6, 5, 0)), east, 'the ground went and the east edge took its place');
  assert.deepEqual(ids(store.getTile(6, 6, 0)), east);
  assert.deepEqual(ids(store.getTile(5, 4, 0)), [Number(EDGE_ITEMS.n)], 'the edge that still fits stayed');
  assert.equal(store.getTile(7, 5, 0), null, 'and the ring moved back in with the terrain');
});

test('a pattern is moved up and down the list, and the file is marked unsaved', async () => {
  const store = await twoTerrainStore();
  const order = () => store.state.terrains.map((terrain) => terrain.id);
  assert.deepEqual(order(), ['0', '1'], 'the file order is the precedence order');

  assert.ok(store.moveTerrain('1', -1));
  assert.deepEqual(order(), ['1', '0']);
  assert.equal(store.state.terrainsDirty, true);
  store.markTerrainsSaved();

  assert.ok(store.moveTerrain('1', 1));
  assert.deepEqual(order(), ['0', '1'], 'and back down again');

  assert.equal(store.moveTerrain('0', -1), false, 'the top pattern has nowhere to go up');
  assert.equal(store.moveTerrain('1', 1), false, 'nor the bottom one down');
  assert.equal(store.moveTerrain('nope', -1), false);
});

test('edges stop at the ground of a pattern above, and are drawn on the ones below', async () => {
  const store = await twoTerrainStore();

  store.selectItem('1'); // grass, the pattern listed first
  store.drawOnTile(5, 5, 0);
  store.selectItem(SAND_GROUND.id); // sand, listed under it
  store.drawOnTile(6, 5, 0);

  assert.deepEqual(
    ids(store.getTile(6, 5, 0)),
    [Number(SAND_GROUND.id), Number(EDGE_ITEMS.e)],
    'the grass edge sits on the sand it borders, above its ground',
  );
  assert.deepEqual(ids(store.getTile(5, 5, 0)), [1], 'but the sand edge stays off the grass above it');
  assert.deepEqual(ids(store.getTile(7, 5, 0)), [Number(SAND_EDGE_ITEMS.e)], 'the sand still fringes plain tiles');
});

test('moving a pattern up hands it the edge where the two terrains meet', async () => {
  const store = await twoTerrainStore([SAND_TERRAIN, TERRAIN]);

  store.selectItem('1'); // grass, now the lower pattern
  store.drawOnTile(5, 5, 0);
  store.selectItem(SAND_GROUND.id);
  store.drawOnTile(6, 5, 0);

  assert.deepEqual(ids(store.getTile(6, 5, 0)), [Number(SAND_GROUND.id)], 'the grass edge gives way to the sand above it');
  assert.deepEqual(
    ids(store.getTile(5, 5, 0)),
    [1, Number(SAND_EDGE_ITEMS.w)],
    'and the sand edge is the one that lands on the grass',
  );
});

test('patterns are added, edited and dropped, and the file is marked unsaved', async () => {
  const store = await terrainStore();
  const id = store.addTerrain();
  assert.equal(id, '1', 'the lowest free id');
  assert.equal(store.state.terrainsDirty, true);
  store.markTerrainsSaved();

  assert.ok(store.updateTerrain(id, { name: 'sand', groundId: 2, outer: { n: 11 } }));
  const terrain = store.getTerrain(id);
  assert.equal(terrain.name, 'sand');
  assert.equal(terrain.groundId, '2', 'ids are stored as strings');
  assert.equal(terrain.outer.n, '11');
  assert.equal(store.state.terrainsDirty, true);
  assert.equal(store.updateTerrain('nope', { name: 'x' }), false);

  assert.ok(store.removeTerrain(id));
  assert.equal(store.getTerrain(id), null);
  assert.equal(store.removeTerrain(id), false);
});
