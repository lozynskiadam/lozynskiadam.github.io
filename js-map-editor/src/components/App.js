import { defineComponent, onMounted } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { useKeyboardShortcuts } from '../composables/useKeyboard.js';
import LoadingOverlay from './LoadingOverlay.js';
import Sidebar from './Sidebar.js';
import Navbar from './Navbar.js';
import MapCanvas from './MapCanvas.js';
import HelpModal from './HelpModal.js';
import ContextMenu from './ContextMenu.js';
import ItemPropertiesModal from './ItemPropertiesModal.js';

export default defineComponent({
  name: 'App',
  components: { LoadingOverlay, Sidebar, Navbar, MapCanvas, HelpModal, ContextMenu, ItemPropertiesModal },
  setup() {
    useKeyboardShortcuts();

    onMounted(() => {
      store.loadItems().catch((error) => {
        console.error('Failed to load items', error);
      });
    });

    return { state: store.state };
  },
  template: `
    <div class="app-root" @contextmenu.prevent>
      <LoadingOverlay v-if="state.loading" />
      <template v-else>
        <Sidebar />
        <Navbar />
        <MapCanvas />
        <HelpModal v-if="state.showHelp" />
        <ItemPropertiesModal v-if="state.itemProperties" />
        <ContextMenu />
      </template>
    </div>
  `,
});
