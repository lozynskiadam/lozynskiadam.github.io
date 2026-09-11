import { defineComponent, onMounted } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { useKeyboardShortcuts } from '../composables/useKeyboard.js';
import LoadingOverlay from './LoadingOverlay.js';
import MenuBar from './MenuBar.js';
import Sidebar from './Sidebar.js';
import Toolbar from './Toolbar.js';
import MapCanvas from './MapCanvas.js';
import HelpModal from './HelpModal.js';
import ContextMenu from './ContextMenu.js';
import ItemPropertiesModal from './ItemPropertiesModal.js';
import ProjectPropertiesModal from './ProjectPropertiesModal.js';

/**
 * Modal dialogs by name - `store.openDialog(name, props)` renders the
 * matching component with `props` bound. Register new dialogs here.
 */
const DIALOGS = {
  help: HelpModal,
  itemProperties: ItemPropertiesModal,
  projectProperties: ProjectPropertiesModal,
};

export default defineComponent({
  name: 'App',
  components: { LoadingOverlay, MenuBar, Sidebar, Toolbar, MapCanvas, ContextMenu },
  setup() {
    useKeyboardShortcuts();

    onMounted(() => {
      store.loadItems().catch((error) => {
        console.error('Failed to load items', error);
      });
    });

    return { state: store.state, dialogs: DIALOGS };
  },
  template: `
    <div class="app-root" @contextmenu.prevent>
      <LoadingOverlay v-if="state.loading" />
      <template v-else>
        <MenuBar />
        <Sidebar />
        <Toolbar />
        <MapCanvas />
        <component v-if="state.dialog" :is="dialogs[state.dialog.name]" v-bind="state.dialog.props" />
        <ContextMenu />
      </template>
    </div>
  `,
});
