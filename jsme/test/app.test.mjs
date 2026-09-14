import './harness.mjs';
import { FakeElement, keydown, mount, responses, settle } from './harness.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

responses['items.json'] = [
  { id: '1', name: 'grass', layer: 'ground', elevation: 0, traits: ['ground'], light: null, image: 'AA==' },
  { id: '2', name: 'crate', layer: 'building', elevation: 8, traits: [], light: null, image: 'AA==' },
];
responses['default-map.json'] = { name: 'Test map', respawnPoint: [10, 10, 0], map: {} };

// editor.js throws on import if two actions claim one shortcut, so importing
// it at all is the check that the registries do not collide.
const { store, actions, workspaceActions, tools } = await import('../src/editor.js');
const { MENUS, TOOLBAR_ACTIONS } = await import('../src/core/menus.js');
const { selectEditor } = await import('../src/core/editors.js');
const { normalizeShortcut, shortcutsOf } = await import('../src/core/shortcuts.js');
const App = (await import('../src/components/App.js')).default;

const errors = [];
const realError = console.error;
console.error = (...args) => errors.push(args.map(String).join(' '));

const view = mount(App);
await settle(6);
console.error = realError;

test('the workspace, the map editor and its panels all render', () => {
  const classes = view.classes();
  for (const name of ['app-root', 'menubar', 'editor-rail', 'map-editor', 'toolbar', 'palette', 'map-canvas']) {
    assert.ok(classes.has(name), `missing .${name}`);
  }
});

test('a machine without WebGL is told so instead of showing a blank map', () => {
  assert.ok(view.classes().has('render-error'), 'the viewport shows the failure');
  assert.ok(
    errors.some((line) => line.includes('WebGL')),
    'and it is logged once, rather than thrown through the component',
  );
});

test('the default map loads into the editor', () => {
  assert.equal(store.state.name, 'Test map');
  assert.deepEqual(store.state.respawnPoint, [10, 10, 0]);
  assert.equal(store.state.loading, false);
});

test('every id the menus and the toolbar reference exists', () => {
  for (const menu of MENUS) {
    for (const id of menu.items) {
      if (id !== null) assert.ok(workspaceActions[id], `menu "${menu.id}" -> unknown action "${id}"`);
    }
  }
  for (const id of TOOLBAR_ACTIONS) assert.ok(actions[id], `toolbar -> unknown action "${id}"`);
});

test('every tool has an action, and no shortcut is claimed twice', () => {
  for (const tool of Object.values(tools)) assert.ok(actions[`tool.${tool.name}`], `tool ${tool.name} has no action`);

  const owners = new Map();
  for (const action of [...Object.values(workspaceActions), ...Object.values(actions)]) {
    for (const shortcut of shortcutsOf(action)) {
      const key = normalizeShortcut(shortcut);
      assert.equal(owners.get(key), undefined, `"${shortcut}" is claimed by both ${owners.get(key)} and ${action.id}`);
      owners.set(key, action.id);
    }
  }
});

test('map shortcuts act on the map', () => {
  const before = store.state.renderFromX;
  keydown({ key: 'ArrowRight' });
  assert.equal(store.state.renderFromX, before + 1);
});

test('Delete clears the whole selection, not just one item', () => {
  store.selectItem('1');
  store.drawOnTile(2, 2, 0);
  store.drawOnTile(3, 2, 0);
  store.beginSelection(2, 2, 0);
  store.updateSelection(2, 2, 3, 2);

  keydown({ key: 'Delete' });
  assert.equal(store.getTile(2, 2, 0), null);
  assert.equal(store.getTile(3, 2, 0), null, 'the ground went too, across the whole area');
  store.clearSelection();
});

test('typing in a field does not paint, pan or switch tools', () => {
  const input = new FakeElement('input');
  const before = store.state.renderFromX;
  keydown({ key: 'ArrowRight', target: input });
  assert.equal(store.state.renderFromX, before, 'the map stayed put');
});

test('File-menu shortcuts still work while a field has focus', () => {
  const input = new FakeElement('input');
  assert.equal(store.state.dialog, null);
  keydown({ key: 'F1', target: input });
  assert.equal(store.state.dialog?.name, 'help', 'Ctrl+S / Ctrl+O / F1 are application commands, not typing');
  keydown({ key: 'Escape' });
  assert.equal(store.state.dialog, null, 'and Escape closes whatever is open');
});

test('an open dialog owns the keyboard', () => {
  store.openDialog('help');
  const before = store.state.renderFromX;
  keydown({ key: 'ArrowRight' });
  assert.equal(store.state.renderFromX, before);
  keydown({ key: 'Escape' });
  assert.equal(store.state.dialog, null);
});

test('switching editors in the rail swaps the whole editor, shortcuts included', async () => {
  selectEditor('items');
  await settle(3);
  assert.ok(view.classes().has('items-editor'));
  assert.ok(!view.classes().has('map-editor'));

  const before = store.state.renderFromX;
  keydown({ key: 'ArrowRight' });
  assert.equal(store.state.renderFromX, before, 'the map editor took its bindings with it');

  keydown({ key: 'F1' });
  assert.equal(store.state.dialog?.name, 'help', 'the File menu stays bound in every editor');
  keydown({ key: 'Escape' });

  selectEditor('creatures');
  await settle(3);
  assert.ok(view.classes().has('empty-editor'), 'an editor with no component yet gets the placeholder');

  selectEditor('map');
  await settle(3);
  assert.ok(view.classes().has('map-editor'));
  keydown({ key: 'ArrowRight' });
  assert.equal(store.state.renderFromX, before + 1, 'and its shortcuts come back with it');
});

test('an unknown editor id is refused rather than blanking the workspace', () => {
  assert.throws(() => selectEditor('nope'));
});

test('the palette shows the catalog and reveals whatever gets selected', async () => {
  const caught = [];
  const realError = console.error;
  console.error = (...args) => caught.push(args.map(String).join(' '));

  store.selectItem('2');
  await settle(3);
  console.error = realError;

  assert.deepEqual(caught, [], 'scrolling the selection into view must not blow up');
  assert.ok(view.classes().has('item-select'), 'the grid rendered its items');
  assert.equal(store.state.selectedItemId, '2');
});

test('the items editor shows the decoded sprite size of the edited item', async () => {
  const { selectEditor } = await import('../src/core/editors.js');
  selectEditor('items');
  store.selectItem('2');
  await settle(3);

  // The name and the other values sit in input values, so what the tree
  // renders as text is the sprite size line and the field hints.
  const text = view.text().replace(/\s+/g, ' ');
  assert.ok(view.classes().has('items-form'), 'the edit form rendered');
  assert.match(text, /32 × 32 px/, 'the form reads the sprite through item.bitmap');
  assert.match(text, /Renumbering an item/, 'and the rest of the form came with it');
  selectEditor('map');
  await settle(3);
});

test('a catalog that will not load is reported rather than swallowed', async () => {
  const previous = responses['items.json'];
  delete responses['items.json'];
  await assert.rejects(() => store.loadItems(), /HTTP 404/);
  assert.equal(store.state.loading, false, 'and the editor does not stay stuck on the spinner');
  responses['items.json'] = previous;
  await store.loadItems();
});
