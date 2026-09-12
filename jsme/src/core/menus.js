/**
 * The menu bar and the map toolbar's action buttons, as data: lists of
 * action ids; `null` renders a separator. Add an entry here and MenuBar.js /
 * Toolbar.js show it - labels, icons, shortcuts and enabled state all come
 * from the action itself.
 */

/** The workspace menu bar above the rail; ids from workspaceActions.js, shared by every editor. */
export const MENUS = [
  {
    id: 'file',
    label: 'File',
    items: ['file.new', 'file.open', 'file.save', null, 'file.properties', null, 'help.shortcuts'],
  },
];

/** Action buttons shown in the map toolbar, left of the tools; ids from actions.js. */
export const TOOLBAR_ACTIONS = ['edit.undo', 'edit.redo'];
