import { defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { store, actions } from '../editor.js';
import { HOLD_KEYS } from '../core/actions.js';
import { allShortcutsLabel } from '../core/shortcuts.js';
import { useDraggable } from '../composables/useDraggable.js';

// Built once from the action registry, so a new shortcut documents itself.
const SHORTCUTS = [
  ...Object.values(actions)
    .filter((action) => action.shortcut)
    .map((action) => [allShortcutsLabel(action), action.hint ? `${action.label} (${action.hint})` : action.label]),
  ...HOLD_KEYS,
];

export default defineComponent({
  name: 'HelpModal',
  setup() {
    const { box, style, startDrag } = useDraggable();
    function close() {
      store.closeDialog();
    }
    return { shortcuts: SHORTCUTS, close, box, style, startDrag };
  },
  template: `
    <div class="modal-overlay" @click.self="close">
      <div class="modal" ref="box" :style="style">
        <div class="modal-header" @pointerdown="startDrag">
          <span>Keyboard shortcuts</span>
          <button type="button" class="modal-close" title="Close" @click="close"></button>
        </div>
        <div class="modal-body">
          <div v-for="[key, label] in shortcuts" :key="key" class="shortcut-row">
            <label class="key">{{ key }}</label> {{ label }}
          </div>
        </div>
      </div>
    </div>
  `,
});
