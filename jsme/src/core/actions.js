/**
 * The map editor's command registry: every user-triggerable operation of
 * the map editor, keyed by a dotted id. Keyboard shortcuts (useMapKeyboard.js),
 * the toolbar (menus.js) and the help dialog are all driven from this one
 * table, so adding a command means adding a single entry here and then
 * referencing its id wherever it should be reachable from. Commands shared
 * by every editor (the File menu) live in workspaceActions.js instead.
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
/** Whether an action may run right now; an action without `enabled` always may. */
export function isActionEnabled(action) {
  return action.enabled ? action.enabled() : true;
}

export function createActions({ store, tools }) {
  const { state } = store;
  const actions = {};

  function define(id, definition) {
    actions[id] = { id, ...definition };
  }

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
        // Pointed at by name, so it goes even if it is a ground item.
        const { x, y, z } = state.highlightedItem;
        store.eraseOnTile(x, y, z, { force: true });
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

  // "+" needs Shift on most layouts, so Ctrl+Shift++ has to count too (see shortcuts.js).
  define('view.zoomIn', {
    label: 'Zoom in',
    shortcut: ['Ctrl++', 'Ctrl+Shift++', 'Ctrl+='],
    enabled: () => store.canZoom(1),
    run() {
      store.stepZoom(1);
    },
  });

  define('view.zoomOut', {
    label: 'Zoom out',
    shortcut: 'Ctrl+-',
    enabled: () => store.canZoom(-1),
    run() {
      store.stepZoom(-1);
    },
  });

  define('view.zoomReset', {
    label: 'Actual size',
    shortcut: 'Ctrl+0',
    enabled: () => state.zoom !== 1,
    run() {
      store.setZoom(1);
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
  ['Ctrl+mouse wheel', 'zoom the map in/out (also the wheel while the middle button is held)'],
];
