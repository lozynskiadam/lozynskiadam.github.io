import { defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { useProjectForm } from '../composables/useProjectForm.js';
import Modal from './Modal.js';
import ProjectFormFields from './ProjectFormFields.js';

/** "Project properties" dialog (File → Properties…): its name and the respawn point saved in the file envelope. */
export default defineComponent({
  name: 'ProjectPropertiesModal',
  components: { Modal, ProjectFormFields },
  setup() {
    // Edited as a local draft and written to the store only on Save, so
    // Cancel/Escape leave the map untouched.
    const { fields, error, read } = useProjectForm(
      { name: store.state.name, respawnPoint: store.state.respawnPoint },
      { missingNameMessage: 'The map needs a name.' },
    );

    function save() {
      const project = read();
      if (!project) return;
      store.setMapName(project.name);
      store.setRespawnPoint(project.respawnPoint);
      store.closeDialog();
    }

    function close() {
      store.closeDialog();
    }

    return { fields, error, save, close };
  },
  template: `
    <Modal title="Project properties">
      <form class="modal-body project-properties" @submit.prevent="save">
        <ProjectFormFields :fields="fields" />
        <div v-if="error" class="project-properties-error">{{ error }}</div>
        <div class="project-properties-actions">
          <button type="button" @click="close">Cancel</button>
          <button type="submit" class="primary">Save</button>
        </div>
      </form>
    </Modal>
  `,
});
