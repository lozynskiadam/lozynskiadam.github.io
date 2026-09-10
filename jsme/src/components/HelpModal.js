import { defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { useDraggable } from '../composables/useDraggable.js';

const SHORTCUTS = [
  ['1', 'pointer tool'],
  ['2', 'select tool'],
  ['3', 'brush tool'],
  ['4', 'eraser tool'],
  ['5', 'sampler tool'],
  ['TAB', 'sampler tool (alt.)'],
  ['Ctrl+C', 'copy selection'],
  ['Ctrl+V', 'paste at cursor'],
  ['+', 'enlarge brush size'],
  ['-', 'decrease brush size'],
  ['X', 'toggle primary/secondary object'],
  ['Del', 'remove highlighted object'],
  ['PgUp', 'higher floor'],
  ['PgDn', 'lower floor'],
  ['Shift', 'hold to allow stacking same layer objects'],
];

export default defineComponent({
  name: 'HelpModal',
  setup() {
    const { box, style, startDrag } = useDraggable();
    function close() {
      store.state.showHelp = false;
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
