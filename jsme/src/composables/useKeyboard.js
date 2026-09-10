import { onMounted, onUnmounted } from '../vendor/vue.esm-browser.prod.js';
import { store, actions } from '../editor.js';
import { normalizeShortcut, shortcutFromEvent } from '../core/shortcuts.js';

// Held-key modes that don't fit the "press = run an action" model.
const SAMPLER_HOLD_KEY = 'Tab';
const STACK_MODE_KEY = 'Shift';

/** Where typing must win over editor shortcuts (the layer <select> is not one: it blurs itself after a change). */
function isTypingTarget(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA)$/.test(target.tagName));
}

/** Wires up every keyboard shortcut for the lifetime of the component that calls this. */
export function useKeyboardShortcuts() {
  // Built once: normalized shortcut -> action.
  const bindings = new Map();
  for (const action of Object.values(actions)) {
    if (!action.shortcut) continue;
    const key = normalizeShortcut(action.shortcut);
    if (bindings.has(key)) throw new Error(`Shortcut "${action.shortcut}" is bound twice`);
    bindings.set(key, action);
  }

  // The tool to restore when Tab is released, or null while Tab is not held.
  let toolBeforeSampler = null;

  function handleKeyDown(event) {
    // A dialog owns the keyboard: Escape closes it, everything else is left alone.
    if (store.state.dialog) {
      if (event.key === 'Escape') {
        event.preventDefault();
        store.closeDialog();
      }
      return;
    }
    if (isTypingTarget(event.target)) return;

    if (event.key === STACK_MODE_KEY) {
      store.state.shiftDown = true;
      return;
    }
    if (event.key === SAMPLER_HOLD_KEY) {
      event.preventDefault();
      if (toolBeforeSampler === null) {
        toolBeforeSampler = store.state.selectedTool;
        store.selectTool('sampler');
      }
      return;
    }

    const action = bindings.get(shortcutFromEvent(event));
    if (!action || (action.enabled && !action.enabled())) return;
    event.preventDefault();
    action.run();
  }

  function handleKeyUp(event) {
    if (event.key === STACK_MODE_KEY) {
      store.state.shiftDown = false;
    }
    if (event.key === SAMPLER_HOLD_KEY && toolBeforeSampler !== null) {
      event.preventDefault();
      store.selectTool(toolBeforeSampler);
      toolBeforeSampler = null;
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  });
}
