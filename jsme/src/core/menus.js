/**
 * The menu bar, as data: each menu is a label plus a list of action ids
 * (see actions.js); `null` renders a separator. Add a menu or an entry here
 * and MenuBar.js shows it - labels, shortcuts and enabled state all come
 * from the action itself.
 */
export const MENUS = [
  {
    id: 'file',
    label: 'File',
    items: ['file.new', 'file.open', 'file.save', null, 'help.shortcuts'],
  },
];
