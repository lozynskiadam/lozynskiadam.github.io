import { defineComponent, ref } from '../vendor/vue.esm-browser.prod.js';
import { store, config } from '../editor.js';
import { useProjectForm } from '../composables/useProjectForm.js';
import Modal from './Modal.js';
import ProjectFormFields from './ProjectFormFields.js';

/** What the form starts on, whatever project is open and whatever the default map holds. */
const NEW_PROJECT = { name: 'Untitled', respawnPoint: [100, 100, 0] };

/**
 * "New project" dialog, opened from the project dropdown in the menu bar.
 * It asks for the same two fields the project properties do (hence the
 * shared ProjectFormFields), seeded with the values a brand new project
 * starts from.
 *
 * Nothing happens to the open project until "Create new project": that is
 * what empties the map, reloads the item catalog and moves the view to the
 * new respawn point (see store.createProject).
 */
export default defineComponent({
  name: 'NewProjectModal',
  components: { Modal, ProjectFormFields },
  setup() {
    const { fields, error, read } = useProjectForm(NEW_PROJECT, { missingNameMessage: 'The project needs a name.' });
    const creating = ref(false);

    async function create() {
      if (creating.value) return;
      const project = read();
      if (!project) return;

      // createProject() closes this dialog once it has switched over; a
      // catalog that fails to load leaves the current project alone, so the
      // dialog stays open with the reason in it.
      creating.value = true;
      try {
        await store.createProject(project);
      } catch (failure) {
        error.value = `Could not load ${config.itemsUrl}: ${failure.message}`;
      } finally {
        creating.value = false;
      }
    }

    function close() {
      store.closeDialog();
    }

    return { fields, error, creating, create, close };
  },
  template: `
    <Modal title="New project">
      <form class="modal-body project-properties" @submit.prevent="create">
        <ProjectFormFields :fields="fields" />
        <div v-if="error" class="project-properties-error">{{ error }}</div>
        <div class="project-properties-actions">
          <button type="button" @click="close">Cancel</button>
          <button type="submit" class="primary" :disabled="creating">Create new project</button>
        </div>
      </form>
    </Modal>
  `,
});
