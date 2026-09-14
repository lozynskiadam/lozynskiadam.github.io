import { store, workspaceActions } from '../editor.js';
import { useKeyboardShortcuts } from './useKeyboard.js';

/** The workspace's keyboard: File-menu shortcuts and Escape for whichever dialog is open, in every editor. */
export function useWorkspaceKeyboard() {
  useKeyboardShortcuts(workspaceActions, {
    whileTyping: true,
    keydown(event) {
      // A dialog owns the keyboard: Escape closes it, everything else is left alone.
      if (!store.state.dialog) return false;
      if (event.key === 'Escape') {
        event.preventDefault();
        store.closeDialog();
      }
      return true;
    },
  });
}
