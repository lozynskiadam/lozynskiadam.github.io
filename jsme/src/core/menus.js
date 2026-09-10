/**
 * The menu bar and the toolbar's action buttons, as data: lists of action
 * ids (see actions.js); `null` renders a separator. Add an entry here and
 * MenuBar.js / Toolbar.js show it - labels, icons, shortcuts and enabled
 * state all come from the action itself.
 */
export const MENUS = [
  {
    id: 'file',
    label: 'File',
    items: ['file.new', 'file.open', 'file.save', null, 'help.shortcuts'],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: ['edit.undo', 'edit.redo'],
  },
];

/** Action buttons shown in the toolbar, left of the tools. */
export const TOOLBAR_ACTIONS = ['edit.undo', 'edit.redo'];
