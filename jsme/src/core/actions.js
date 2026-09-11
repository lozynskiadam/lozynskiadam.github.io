import { pickMapFile, readMapFile, downloadMapFile } from './mapFile.js';

/**
 * The editor's command registry: every user-triggerable operation, keyed
 * by a dotted id. Menus (menus.js), keyboard shortcuts (useKeyboard.js),
 * the toolbar and the help dialog are all driven from this one table, so
 * adding a command means adding a single entry here and then referencing
 * its id wherever it should be reachable from.
 *
 * An action has:
 *   label      - text for menus and the help dialog
 *   run()      - what it does; may be async
 *   shortcut   - optional key combo in shortcuts.js notation, or a list of
 *                alternatives (the first one is the displayed one)
 *   icon       - optional sprite name from app.css `[data-icon]`
 *   enabled()  - optional predicate; a disabled action is greyed out in
 *                menus and its shortcut is ignored
 *   hint       - optional extra note for the help dialog
 */
export function createActions({ store, tools }) {
  const { state } = store;
  const actions = {};

  function define(id, definition) {
    actions[id] = { id, ...definition };
  }

  /* ---- file --------------------------------------------------------- */

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

  /* ---- tools -------------------------------------------------------- */

  for (const tool of Object.values(tools)) {
    define(`tool.${tool.name}`, {
      label: `${tool.title} tool`,
      icon: tool.name,
      shortcut: tool.shortcut,
      hint: tool.hint,
      run() {
        store.selectTool(tool.name);
      },
    });
  }

  /* ---- edit --------------------------------------------------------- */

  define('edit.undo', {
    label: 'Undo',
    icon: 'undo',
    shortcut: 'Ctrl+Z',
    enabled: () => state.undoDepth > 0 && !store.isGestureOpen(),
    run() {
      store.undo();
    },
  });

  define('edit.redo', {
    label: 'Redo',
    icon: 'redo',
    shortcut: ['Ctrl+Y', 'Ctrl+Shift+Z'],
    enabled: () => state.redoDepth > 0 && !store.isGestureOpen(),
    run() {
      store.redo();
    },
  });

  define('edit.copy', {
    label: 'Copy selection',
    shortcut: 'Ctrl+C',
    enabled: () => !!state.selection,
    run() {
      store.copySelection();
    },
  });

  define('edit.paste', {
    label: 'Paste at cursor',
    shortcut: 'Ctrl+V',
    enabled: () => !!state.clipboard,
    run() {
      store.pasteClipboard(state.cursorPosition.x, state.cursorPosition.y, state.currentFloor);
    },
  });

  define('edit.delete', {
    label: 'Remove highlighted object',
    shortcut: 'Delete',
    run() {
      if (state.highlightedItem) {
        const { x, y, z } = state.highlightedItem;
        store.eraseOnTile(x, y, z);
        store.clearHighlight();
      } else {
        store.eraseOnTile(state.cursorPosition.x, state.cursorPosition.y, state.currentFloor);
      }
    },
  });

  define('edit.swapItems', {
    label: 'Toggle primary/secondary object',
    shortcut: 'X',
    run() {
      store.swapItems();
    },
  });

  /* ---- brush -------------------------------------------------------- */

  define('brush.grow', {
    label: 'Enlarge brush',
    shortcut: '+',
    run() {
      store.setBrushSize(state.brushSize + 1);
    },
  });

  define('brush.shrink', {
    label: 'Shrink brush',
    shortcut: '-',
    run() {
      store.setBrushSize(state.brushSize - 1);
    },
  });

  /* ---- view --------------------------------------------------------- */

  define('view.floorUp', {
    label: 'Higher floor',
    shortcut: 'PageUp',
    run() {
      store.setCurrentFloor(state.currentFloor + 1);
    },
  });

  define('view.floorDown', {
    label: 'Lower floor',
    shortcut: 'PageDown',
    run() {
      store.setCurrentFloor(state.currentFloor - 1);
    },
  });

  // Arrow keys and WASD both scroll the map.
  const PAN = [
    ['Up', ['ArrowUp', 'W'], 0, -1],
    ['Down', ['ArrowDown', 'S'], 0, 1],
    ['Left', ['ArrowLeft', 'A'], -1, 0],
    ['Right', ['ArrowRight', 'D'], 1, 0],
  ];
  for (const [name, shortcuts, dx, dy] of PAN) {
    define(`view.pan${name}`, {
      label: `Scroll map ${name.toLowerCase()}`,
      shortcut: shortcuts,
      run() {
        store.pan(dx, dy);
      },
    });
  }

  return actions;
}

/** Keys that act while held rather than when pressed - listed in the help dialog next to the actions. */
export const HOLD_KEYS = [
  ['Shift', 'hold to allow stacking same layer objects'],
  ['Tab', 'hold for the sampler tool'],
  ['Middle mouse button', 'hold and drag to scroll the map'],
];
