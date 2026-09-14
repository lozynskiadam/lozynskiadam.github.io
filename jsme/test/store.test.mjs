import './harness.mjs';
import { responses } from './harness.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createStore, toCamelCase } from '../src/core/store.js';

const CONFIG = { itemsUrl: 'items.json', mapUrl: 'default-map.json', tileSize: 32, maxElevation: 64, maxLightLevel: 16, minFloor: -7, maxFloor: 7 };

const ITEMS = [
  { id: '1', name: 'grass', layer: 'ground', elevation: 0, traits: ['ground'], light: null, image: 'AA==' },
  { id: '2', name: 'crate', layer: 'building', elevation: 8, traits: ['movable'], light: null, image: 'AA==' },
  { id: '3', name: 'barrel', layer: 'building', elevation: 4, traits: [], light: null, image: 'AA==' },
  { id: '4', name: 'bush', layer: 'nature', elevation: 0, traits: [], light: null, image: 'AA==' },
];

/** A store with the fixture catalog loaded, ready to paint on. */
async function freshStore() {
  responses['items.json'] = ITEMS;
  const store = createStore(CONFIG);
  await store.loadItems();
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
