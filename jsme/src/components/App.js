import { defineComponent, computed, onMounted } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { EDITORS, workspace } from '../core/editors.js';
import { useWorkspaceKeyboard } from '../composables/useWorkspaceKeyboard.js';
import MenuBar from './MenuBar.js';
import EditorRail from './EditorRail.js';
import DialogHost from './DialogHost.js';
import MapEditor from './MapEditor.js';
import ItemsEditor from './ItemsEditor.js';
import EmptyEditor from './EmptyEditor.js';
import HelpModal from './HelpModal.js';
import ProjectPropertiesModal from './ProjectPropertiesModal.js';
import NewProjectModal from './NewProjectModal.js';

/**
 * Editor components by id (see core/editors.js). An editor without a
 * component yet gets the EmptyEditor placeholder.
 */
const EDITOR_COMPONENTS = {
  map: MapEditor,
  items: ItemsEditor,
};

/**
 * Dialogs opened from the menu bar, by name - rendered here so they show
 * whichever editor is active. An editor's own dialogs go in that editor
 * (see MapEditor.js).
 */
const DIALOGS = {
  help: HelpModal,
  projectProperties: ProjectPropertiesModal,
  newProject: NewProjectModal,
};

/**
 * The workspace shell: the shared menu bar on top, the rail on the left
 * and whichever editor is active on the right. Editors are mounted one at
 * a time - each brings its own panels and keyboard shortcuts and takes
 * them away on unmount; only the File-menu shortcuts are bound here.
 */
export default defineComponent({
  name: 'App',
  components: { MenuBar, EditorRail, DialogHost },
  setup() {
    useWorkspaceKeyboard();

    // The item catalog is shared (the map needs it to draw, the item editor
    // will edit it), so it loads once here rather than per editor - and so
    // do the map the editor opens on and the terrain patterns. None blocks
    // the others; a failed load leaves the editor usable, on an empty map,
    // with no catalog or with no patterns.
    onMounted(() => {
      store.loadItems().catch((error) => {
        console.error('Failed to load items', error);
      });
      store.loadDefaultMap().catch((error) => {
        console.error('Failed to load the default map', error);
      });
      store.loadTerrains().catch((error) => {
        console.error('Failed to load the terrain patterns', error);
      });
    });

    const activeEditor = computed(() => EDITORS.find((editor) => editor.id === workspace.activeEditor));
    const activeComponent = computed(() => EDITOR_COMPONENTS[workspace.activeEditor] ?? EmptyEditor);
    const activeProps = computed(() =>
      activeComponent.value === EmptyEditor ? { label: activeEditor.value.label } : {},
    );

    return { workspace, activeComponent, activeProps, dialogs: DIALOGS };
  },
  template: `
    <div class="app-root" @contextmenu.prevent>
      <MenuBar />
      <div class="workspace">
        <EditorRail />
        <div class="editor-view">
          <component :is="activeComponent" :key="workspace.activeEditor" v-bind="activeProps" />
        </div>
      </div>
      <DialogHost :dialogs="dialogs" />
    </div>
  `,
});
