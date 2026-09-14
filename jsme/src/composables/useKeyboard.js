import { onMounted, onUnmounted } from '../vendor/vue.esm-browser.prod.js';
import { normalizeShortcut, shortcutFromEvent, shortcutsOf } from '../core/shortcuts.js';

/** Where typing must win over editor shortcuts (the layer <select> is not one: it blurs itself after a change). */
export function isTypingTarget(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA)$/.test(target.tagName));
}

/**
 * Maps the shortcuts of an action registry onto the keyboard for the
 * lifetime of the calling component. Every editor calls this with its own
 * actions from its root component, so the bindings come and go with the
 * editor and never overlap.
 *
 * Hooks let an editor handle what the "press = run an action" model does
 * not cover (held keys, modal dialogs):
 *   keydown(event) - runs first; return true to claim the event so no
 *                    action is looked up for it
 *   keyup(event)   - every key release
 *
 * `whileTyping` keeps the shortcuts live inside inputs. Only the workspace
 * wants that: its combos (Ctrl+S, Ctrl+O, F1) are application commands that
 * nobody types, unlike the map editor's bare letters.
 */
export function useKeyboardShortcuts(actions, { keydown, keyup, whileTyping = false } = {}) {
  // Built once: normalized shortcut -> action.
  const bindings = new Map();
  for (const action of Object.values(actions)) {
    for (const shortcut of shortcutsOf(action)) {
      const key = normalizeShortcut(shortcut);
      if (bindings.has(key)) throw new Error(`Shortcut "${shortcut}" is bound twice`);
      bindings.set(key, action);
    }
  }

  function handleKeyDown(event) {
    if (keydown?.(event)) return;
    if (!whileTyping && isTypingTarget(event.target)) return;

    const action = bindings.get(shortcutFromEvent(event));
    if (!action || (action.enabled && !action.enabled())) return;
    event.preventDefault();
    action.run();
  }

  function handleKeyUp(event) {
    keyup?.(event);
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
