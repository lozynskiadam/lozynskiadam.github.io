import { defineComponent, computed, onMounted } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { EDITORS, workspace } from '../core/editors.js';
import { useWorkspaceKeyboard } from '../composables/useWorkspaceKeyboard.js';
import MenuBar from './MenuBar.js';
import EditorRail from './EditorRail.js';
import MapEditor from './MapEditor.js';
import ItemsEditor from './ItemsEditor.js';
import EmptyEditor from './EmptyEditor.js';
import HelpModal from './HelpModal.js';
import ProjectPropertiesModal from './ProjectPropertiesModal.js';

/**
 * Editor components by id (see core/editors.js). An editor without a
 * component yet gets the EmptyEditor placeholder.
 */
const EDITOR_COMPONENTS = {
  map: MapEditor,
  items: ItemsEditor,
};

/**
 * Dialogs opened from the File menu, by name - rendered here so they show
 * whichever editor is active. An editor's own dialogs go in that editor
 * (see MapEditor.js).
 */
const DIALOGS = {
  help: HelpModal,
  projectProperties: ProjectPropertiesModal,
};

/**
 * The workspace shell: the shared menu bar on top, the rail on the left
 * and whichever editor is active on the right. Editors are mounted one at
 * a time - each brings its own panels and keyboard shortcuts and takes
 * them away on unmount; only the File-menu shortcuts are bound here.
 */
export default defineComponent({
  name: 'App',
  components: { MenuBar, EditorRail },
  setup() {
    useWorkspaceKeyboard();

    // The item catalog is shared (the map needs it to draw, the item editor
    // will edit it), so it loads once here rather than per editor.
    onMounted(() => {
      store.loadItems().catch((error) => {
        console.error('Failed to load items', error);
      });
    });

    const activeEditor = computed(() => EDITORS.find((editor) => editor.id === workspace.activeEditor));
    const activeComponent = computed(() => EDITOR_COMPONENTS[workspace.activeEditor] ?? EmptyEditor);
    const activeProps = computed(() =>
      activeComponent.value === EmptyEditor ? { label: activeEditor.value.label } : {},
    );

    return { state: store.state, workspace, activeComponent, activeProps, dialogs: DIALOGS };
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
      <component v-if="state.dialog && dialogs[state.dialog.name]" :is="dialogs[state.dialog.name]" v-bind="state.dialog.props" />
    </div>
  `,
});
