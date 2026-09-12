import { store, actions } from '../editor.js';
import { useKeyboardShortcuts, isTypingTarget } from './useKeyboard.js';

// Held-key modes that don't fit the "press = run an action" model.
const SAMPLER_HOLD_KEY = 'Tab';
const STACK_MODE_KEY = 'Shift';

/** The map editor's keyboard: its action shortcuts plus the held-key modes. */
export function useMapKeyboard() {
  // Whether Tab is currently holding the sampler; releasing it always lands on the brush
  // (the natural next step after picking an item is painting with it).
  let samplerHeld = false;

  useKeyboardShortcuts(actions, {
    keydown(event) {
      // A dialog owns the keyboard (the workspace closes it on Escape, see useWorkspaceKeyboard).
      if (store.state.dialog) return true;
      if (isTypingTarget(event.target)) return true;

      if (event.key === STACK_MODE_KEY) {
        store.state.shiftDown = true;
        return true;
      }
      if (event.key === SAMPLER_HOLD_KEY) {
        event.preventDefault();
        if (!samplerHeld) {
          samplerHeld = true;
          store.selectTool('sampler');
        }
        return true;
      }
      return false;
    },
    keyup(event) {
      if (event.key === STACK_MODE_KEY) {
        store.state.shiftDown = false;
      }
      if (event.key === SAMPLER_HOLD_KEY && samplerHeld) {
        event.preventDefault();
        samplerHeld = false;
        store.selectTool('brush');
      }
    },
  });
}
