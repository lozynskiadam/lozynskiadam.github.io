import { defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';

/**
 * Renders whichever dialog `store.openDialog(name, props)` asked for, if it
 * is one of the `dialogs` this host knows. Two hosts are mounted at once -
 * the workspace's (App.js) and the active editor's (MapEditor.js) - and
 * each simply ignores a name the other owns.
 */
export default defineComponent({
  name: 'DialogHost',
  props: {
    dialogs: { type: Object, required: true },
  },
  setup() {
    return { state: store.state };
  },
  template: `
    <component
      v-if="state.dialog && dialogs[state.dialog.name]"
      :is="dialogs[state.dialog.name]"
      v-bind="state.dialog.props"
    />
  `,
});
