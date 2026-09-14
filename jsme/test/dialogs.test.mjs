import './harness.mjs';
import { mount, responses, settle } from './harness.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

responses['items.json'] = [
  { id: '1', name: 'grass', layer: 'ground', elevation: 0, traits: ['ground'], light: null, image: 'AA==' },
  { id: '2', name: 'crate', layer: 'building', elevation: 8, traits: [], light: null, image: 'AA==' },
];
responses['default-map.json'] = { name: 'Test map', respawnPoint: [10, 10, 0], map: {} };

const { store, config } = await import('../src/editor.js');
const { useProjectForm } = await import('../src/composables/useProjectForm.js');
const App = (await import('../src/components/App.js')).default;

const realError = console.error;
console.error = () => {};
const view = mount(App);
await settle(6);
console.error = realError;

async function open(name, props) {
  store.openDialog(name, props);
  await settle(2);
}

test('every dialog renders inside the shared modal shell', async () => {
  for (const [name, title] of [
    ['help', 'Keyboard shortcuts'],
    ['projectProperties', 'Project properties'],
    ['newProject', 'New project'],
  ]) {
    await open(name);
    const classes = view.classes();
    assert.ok(classes.has('modal-overlay'), `${name}: no overlay`);
    assert.ok(classes.has('modal-header'), `${name}: no draggable header`);
    assert.ok(classes.has('modal-close'), `${name}: no close button`);
    assert.ok(classes.has('modal-body'), `${name}: no body`);
    assert.ok(view.text().includes(title), `${name}: the title bar should read "${title}"`);
  }
  store.closeDialog();
  await settle(2);
  assert.ok(!view.classes().has('modal-overlay'), 'and closing takes the whole shell away');
});

test('the help dialog lists the shortcuts the registries declare', async () => {
  await open('help');
  const text = view.text();
  assert.ok(text.includes('Ctrl+S'), 'a File-menu shortcut');
  assert.ok(text.includes('PgUp'), 'a map shortcut, in its display form');
  assert.ok(text.includes('hold for the sampler tool'), 'and the held keys');
  store.closeDialog();
  await settle(2);
});

test('the item properties dialog shows the item it was opened for', async () => {
  store.selectItem('2');
  store.drawOnTile(4, 5, 0);
  await open('itemProperties', { itemId: 2, x: 4, y: 5, z: 0 });

  const text = view.text();
  assert.ok(text.includes('Item properties'));
  assert.ok(text.includes('crate'), 'the item name');
  assert.ok(text.includes('4, 5, 0'), 'and where on the map it sits');
  store.closeDialog();
  await settle(2);
});

test('a dialog belonging to the map editor is dropped when that editor goes', async () => {
  const { selectEditor } = await import('../src/core/editors.js');
  await open('itemProperties', { itemId: 2, x: 4, y: 5, z: 0 });
  selectEditor('items');
  await settle(3);
  assert.equal(store.state.dialog, null, 'it does not reappear over the next editor');
  selectEditor('map');
  await settle(3);
});

/* ---- the draft both project dialogs share ------------------------------ */

const form = (initial) => useProjectForm(initial, { missingNameMessage: 'needs a name' });

test('a valid draft reads back trimmed and typed', () => {
  const { fields, read, error } = form({ name: ' Town ', respawnPoint: [1, 2, 3] });
  assert.deepEqual(read(), { name: 'Town', respawnPoint: [1, 2, 3] });
  assert.equal(error.value, '');
  fields.name = 'Other';
  assert.equal(read().name, 'Other');
});

test('a blank name is reported and nothing is read', () => {
  const { read, error } = form({ name: '   ', respawnPoint: [1, 2, 3] });
  assert.equal(read(), null);
  assert.equal(error.value, 'needs a name');
});

test('coordinates must be whole numbers inside their range', () => {
  const { fields, read, error } = form({ name: 'Town', respawnPoint: [1, 2, 3] });

  fields.x = '1.5';
  assert.equal(read(), null);
  assert.match(error.value, /X must be a whole number/);

  fields.x = '';
  assert.equal(read(), null);
  assert.match(error.value, /X must be a whole number/);

  fields.x = -1;
  assert.equal(read(), null);
  assert.match(error.value, /X must be between/);

  fields.x = 1;
  fields.z = config.maxFloor + 1;
  assert.equal(read(), null);
  assert.match(error.value, new RegExp(`Floor must be between ${config.minFloor} and ${config.maxFloor}`));

  fields.z = config.minFloor;
  assert.deepEqual(read(), { name: 'Town', respawnPoint: [1, 2, config.minFloor] });
  assert.equal(error.value, '', 'a good read clears the last complaint');
});

test('a number typed as text still reads as a number', () => {
  const { fields, read } = form({ name: 'Town', respawnPoint: [0, 0, 0] });
  fields.x = '12';
  assert.deepEqual(read().respawnPoint, [12, 0, 0]);
});
