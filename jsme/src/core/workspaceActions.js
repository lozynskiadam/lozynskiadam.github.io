import { pickMapFile, readMapFile, downloadMapFile } from './mapFile.js';

/**
 * Commands shared by every editor: the File menu. They live outside the
 * map editor's registry (actions.js) because the menu bar sits above the
 * rail and these must work - by click or shortcut - whichever editor is
 * showing. Same shape as a map action (see actions.js).
 *
 * The project file is still just the map file; when the other editors get
 * content, this is where their data joins the envelope.
 */
export function createWorkspaceActions({ store }) {
  const actions = {};

  function define(id, definition) {
    actions[id] = { id, ...definition };
  }

  define('file.new', {
    label: 'New',
    icon: 'new',
    run() {
      if (store.hasMapContent() && !confirm('Discard the current map?')) return;
      store.newMap();
    },
  });

  define('file.open', {
    label: 'Open…',
    icon: 'open',
    shortcut: 'Ctrl+O',
    async run() {
      if (store.hasMapContent() && !confirm('Discard the current map?')) return;
      const file = await pickMapFile();
      if (!file) return;
      try {
        store.loadMapFile(await readMapFile(file));
      } catch (error) {
        alert(error.message);
      }
    },
  });

  define('file.save', {
    label: 'Save',
    icon: 'save',
    shortcut: 'Ctrl+S',
    run() {
      downloadMapFile(store.exportMapFile());
    },
  });

  define('file.properties', {
    label: 'Properties…',
    run() {
      store.toggleDialog('projectProperties');
    },
  });

  define('help.shortcuts', {
    label: 'Help',
    icon: 'help',
    shortcut: 'F1',
    run() {
      store.toggleDialog('help');
    },
  });

  return actions;
}
