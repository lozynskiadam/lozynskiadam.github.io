import { defineComponent, ref } from '../vendor/vue.esm-browser.prod.js';
import { store, config } from '../editor.js';
import { useDraggable } from '../composables/useDraggable.js';

/** What the form starts on, whatever project is open and whatever the default map holds. */
const NEW_PROJECT = { name: 'Untitled', respawnPoint: [100, 100, 0] };

/**
 * "New project" dialog, opened from the project dropdown in the menu bar.
 * It asks for the same two fields the project properties do - for now the
 * form is deliberately a copy of that one, seeded with the values a brand
 * new project starts from.
 *
 * Nothing happens to the open project until "Create new project": that is
 * what empties the map, reloads the item catalog and moves the view to the
 * new respawn point (see store.createProject).
 */
export default defineComponent({
  name: 'NewProjectModal',
  setup() {
    const { box, style, startDrag } = useDraggable();

    const name = ref(NEW_PROJECT.name);
    const respawnX = ref(NEW_PROJECT.respawnPoint[0]);
    const respawnY = ref(NEW_PROJECT.respawnPoint[1]);
    const respawnZ = ref(NEW_PROJECT.respawnPoint[2]);
    const error = ref('');
    const creating = ref(false);

    function parseCoordinate(value, label, min, max) {
      const number = Number(value);
      if (value === '' || value === null || !Number.isInteger(number)) throw new Error(`${label} must be a whole number.`);
      if (number < min || number > max) throw new Error(`${label} must be between ${min} and ${max}.`);
      return number;
    }

    async function create() {
      if (creating.value) return;
      const trimmed = String(name.value).trim();
      if (!trimmed) {
        error.value = 'The project needs a name.';
        return;
      }
      let point;
      try {
        point = [
          parseCoordinate(respawnX.value, 'X', 0, Number.MAX_SAFE_INTEGER),
          parseCoordinate(respawnY.value, 'Y', 0, Number.MAX_SAFE_INTEGER),
          parseCoordinate(respawnZ.value, 'Floor', config.minFloor, config.maxFloor),
        ];
      } catch (validation) {
        error.value = validation.message;
        return;
      }

      // createProject() closes this dialog once it has switched over; a
      // catalog that fails to load leaves the current project alone, so the
      // dialog stays open with the reason in it.
      error.value = '';
      creating.value = true;
      try {
        await store.createProject({ name: trimmed, respawnPoint: point });
      } catch (failure) {
        error.value = `Could not load ${config.itemsUrl}: ${failure.message}`;
      } finally {
        creating.value = false;
      }
    }

    function close() {
      store.closeDialog();
    }

    return {
      name,
      respawnX,
      respawnY,
      respawnZ,
      minFloor: config.minFloor,
      maxFloor: config.maxFloor,
      error,
      creating,
      create,
      close,
      box,
      style,
      startDrag,
    };
  },
  template: `
    <div class="modal-overlay" @click.self="close">
      <div class="modal" ref="box" :style="style">
        <div class="modal-header" @pointerdown="startDrag">
          <span>New project</span>
          <button type="button" class="modal-close" title="Close" @click="close"></button>
        </div>
        <form class="modal-body project-properties" @submit.prevent="create">
          <label class="project-properties-field">
            <span>Name</span>
            <input type="text" v-model="name" spellcheck="false" autofocus />
          </label>
          <div class="project-properties-field">
            <span>Respawn point</span>
            <div class="project-properties-point">
              <label>X <input type="number" v-model="respawnX" min="0" step="1" /></label>
              <label>Y <input type="number" v-model="respawnY" min="0" step="1" /></label>
              <label>Floor <input type="number" v-model="respawnZ" :min="minFloor" :max="maxFloor" step="1" /></label>
            </div>
          </div>
          <div v-if="error" class="project-properties-error">{{ error }}</div>
          <div class="project-properties-actions">
            <button type="button" @click="close">Cancel</button>
            <button type="submit" class="primary" :disabled="creating">Create new project</button>
          </div>
        </form>
      </div>
    </div>
  `,
});
