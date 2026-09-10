import { defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';

const SHORTCUTS = [
  ['Q', 'pointer tool'],
  ['W', 'brush tool'],
  ['E', 'eraser tool'],
  ['R', 'sampler tool'],
  ['TAB', 'sampler tool (alt.)'],
  ['S', 'select tool'],
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
    function close() {
      store.state.showHelp = false;
    }
    return { shortcuts: SHORTCUTS, close };
  },
  template: `
    <div class="modal-overlay" @click.self="close">
      <div class="modal">
        <div class="modal-header">
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
