import { defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { actions, workspaceActions } from '../editor.js';
import { HOLD_KEYS } from '../core/actions.js';
import { allShortcutsLabel } from '../core/shortcuts.js';
import Modal from './Modal.js';

// Built once from the action registries, so a new shortcut documents itself.
const SHORTCUTS = [
  ...[...Object.values(workspaceActions), ...Object.values(actions)]
    .filter((action) => action.shortcut)
    .map((action) => [allShortcutsLabel(action), action.hint ? `${action.label} (${action.hint})` : action.label]),
  ...HOLD_KEYS,
];

export default defineComponent({
  name: 'HelpModal',
  components: { Modal },
  setup() {
    return { shortcuts: SHORTCUTS };
  },
  template: `
    <Modal title="Keyboard shortcuts">
      <div class="modal-body">
        <div v-for="[key, label] in shortcuts" :key="key" class="shortcut-row">
          <label class="key">{{ key }}</label> {{ label }}
        </div>
      </div>
    </Modal>
  `,
});
