import { defineComponent, onBeforeUnmount } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { useMapKeyboard } from '../composables/useMapKeyboard.js';
import LoadingOverlay from './LoadingOverlay.js';
import Sidebar from './Sidebar.js';
import Toolbar from './Toolbar.js';
import MapCanvas from './MapCanvas.js';
import ContextMenu from './ContextMenu.js';
import DialogHost from './DialogHost.js';
import ItemPropertiesModal from './ItemPropertiesModal.js';
import TerrainsModal from './TerrainsModal.js';

/**
 * The map editor's own dialogs by name - `store.openDialog(name, props)`
 * renders the matching component with `props` bound. Dialogs reachable
 * from the File menu (help, project properties) are registered in App.js
 * instead, so they open in every editor.
 */
const DIALOGS = {
  itemProperties: ItemPropertiesModal,
  terrains: TerrainsModal,
};

/**
 * The map editor as a whole: tool/item panels, the viewport and its
 * dialogs. Its keyboard shortcuts live only as long as it is mounted, so
 * switching to another editor in the rail takes them down with it.
 *
 * The toolbar and the viewport share one `.map-panel` wrapper: it is the
 * card that carries the rounded corners, so the rulers and the canvas get
 * clipped by it instead of each rounding its own edge.
 */
export default defineComponent({
  name: 'MapEditor',
  components: { LoadingOverlay, Sidebar, Toolbar, MapCanvas, ContextMenu, DialogHost },
  setup() {
    useMapKeyboard();

    // Popups belong to this editor's screen; leaving it should not bring
    // them back later (nor keep a Shift that was released elsewhere).
    onBeforeUnmount(() => {
      if (store.state.dialog && DIALOGS[store.state.dialog.name]) store.closeDialog();
      store.closeContextMenu();
      store.state.shiftDown = false;
    });

    return { state: store.state, dialogs: DIALOGS };
  },
  template: `
    <div class="map-editor">
      <LoadingOverlay v-if="state.loading" />
      <template v-else>
        <Sidebar />
        <div class="map-panel">
          <Toolbar />
          <MapCanvas />
        </div>
        <DialogHost :dialogs="dialogs" />
        <ContextMenu />
      </template>
    </div>
  `,
});
