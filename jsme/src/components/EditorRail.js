import { defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { EDITORS, workspace, selectEditor } from '../core/editors.js';

/** The vertical strip on the far left that switches between editors. */
export default defineComponent({
  name: 'EditorRail',
  setup() {
    return { editors: EDITORS, workspace, selectEditor };
  },
  template: `
    <nav class="editor-rail" aria-label="Editors">
      <button
        v-for="editor in editors"
        :key="editor.id"
        type="button"
        class="editor-rail-button"
        :class="{ active: workspace.activeEditor === editor.id }"
        :title="editor.label + ' editor'"
        :aria-pressed="workspace.activeEditor === editor.id"
        @click="selectEditor(editor.id)"
      ><span class="rail-icon" :data-icon="editor.icon"></span></button>
    </nav>
  `,
});
