/**
 * Keyboard shortcut notation shared by actions, the key handler and the UI.
 *
 * Shortcuts are written the way they are displayed - "Ctrl+S", "PageUp",
 * "Delete", "+", "X" - using KeyboardEvent.key names for the key part.
 * Shift only counts as a modifier together with Ctrl ("Ctrl+Shift+Z"):
 * on its own "+" already needs it on many layouts, and the editor uses a
 * held Shift as a mode (see useKeyboard).
 */

const MODIFIERS = new Set(['alt', 'ctrl', 'shift']);

// Friendlier spellings for the help dialog and menu hints.
const DISPLAY_NAMES = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  Delete: 'Del',
  Escape: 'Esc',
};

/** Canonical lookup key for a shortcut string: lower-case, modifiers first ("Ctrl+S" -> "ctrl+s"). */
export function normalizeShortcut(shortcut) {
  const parts = shortcut.split('+').map((part) => part.trim().toLowerCase());
  // A trailing "+" key ("Ctrl++" or just "+") splits into empty strings.
  const key = parts[parts.length - 1] === '' ? '+' : parts[parts.length - 1];
  const modifiers = parts.slice(0, -1).filter((part) => MODIFIERS.has(part)).sort();
  return [...modifiers, key].join('+');
}

/** The same canonical key for a live KeyboardEvent (Meta counts as Ctrl so macOS users get the usual combos). */
export function shortcutFromEvent(event) {
  const modifiers = [];
  if (event.altKey) modifiers.push('alt');
  if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
  if (event.shiftKey && modifiers.includes('ctrl')) modifiers.push('shift');
  return [...modifiers, event.key.toLowerCase()].join('+');
}

/** An action's shortcuts as a list: `shortcut` may be a string, a list of alternatives, or absent. */
export function shortcutsOf(action) {
  if (!action.shortcut) return [];
  return Array.isArray(action.shortcut) ? action.shortcut : [action.shortcut];
}

/** The display form of an action's primary shortcut ("" when it has none). */
export function primaryShortcutLabel(action) {
  const [first] = shortcutsOf(action);
  return first ? formatShortcut(first) : '';
}

/** Every shortcut of an action for display: "↑ / W". */
export function allShortcutsLabel(action) {
  return shortcutsOf(action).map(formatShortcut).join(' / ');
}

/** "PageUp" -> "PgUp", "Ctrl+ArrowUp" -> "Ctrl+↑"; anything else passes through. */
export function formatShortcut(shortcut) {
  return shortcut
    .split('+')
    .map((part) => DISPLAY_NAMES[part] ?? part)
    .join('+');
}
