/**
 * Keyboard shortcut notation shared by actions, the key handler and the UI.
 *
 * Shortcuts are written the way they are displayed - "Ctrl+S", "PageUp",
 * "Delete", "+", "X" - using KeyboardEvent.key names for the key part.
 * Shift is deliberately not a modifier here: "+" already needs it on many
 * layouts, and the editor uses a held Shift as a mode (see useKeyboard).
 */

const MODIFIERS = new Set(['ctrl', 'alt']);

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
  return [...modifiers, event.key.toLowerCase()].join('+');
}

/** "PageUp" -> "PgUp", "Ctrl+ArrowUp" -> "Ctrl+↑"; anything else passes through. */
export function formatShortcut(shortcut) {
  return shortcut
    .split('+')
    .map((part) => DISPLAY_NAMES[part] ?? part)
    .join('+');
}
