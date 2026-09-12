import { reactive } from '../vendor/vue.esm-browser.prod.js';

/**
 * The editors the workspace is made of, in rail order. Each one is a
 * self-contained tool with its own menu bar, panels and keyboard shortcuts;
 * only one is mounted at a time, so a shortcut never leaks from one editor
 * into another. App.js maps an id to the component that renders it.
 *
 *   id     - stable key, also what selectEditor() takes
 *   label  - rail tooltip / placeholder heading
 *   icon   - sprite name from app.css `.rail-icon[data-icon]`
 */
export const EDITORS = [
  { id: 'map', label: 'Map', icon: 'map' },
  { id: 'items', label: 'Items', icon: 'items' },
  { id: 'creatures', label: 'Creatures', icon: 'creatures' },
  { id: 'effects', label: 'Effects', icon: 'effects' },
  { id: 'scripts', label: 'Scripts', icon: 'scripts' },
];

/** Workspace-level state: which editor is shown. Kept apart from the map store, which knows nothing about other editors. */
export const workspace = reactive({
  activeEditor: EDITORS[0].id,
});

export function selectEditor(id) {
  if (!EDITORS.some((editor) => editor.id === id)) throw new Error(`Unknown editor "${id}"`);
  workspace.activeEditor = id;
}
