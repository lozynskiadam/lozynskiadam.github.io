import { defineComponent, ref } from '../vendor/vue.esm-browser.prod.js';
import { store, config } from '../editor.js';
import { useDraggable } from '../composables/useDraggable.js';

/** "Project properties" dialog (File → Properties…): its name and the respawn point saved in the file envelope. */
export default defineComponent({
  name: 'ProjectPropertiesModal',
  setup() {
    const { box, style, startDrag } = useDraggable();

    // Edited as a local draft and written to the store only on Save, so
    // Cancel/Escape leave the map untouched.
    const name = ref(store.state.name);
    const [x, y, z] = store.state.respawnPoint;
    const respawnX = ref(x);
    const respawnY = ref(y);
    const respawnZ = ref(z);
    const error = ref('');

    function parseCoordinate(value, label, min, max) {
      const number = Number(value);
      if (value === '' || value === null || !Number.isInteger(number)) throw new Error(`${label} must be a whole number.`);
      if (number < min || number > max) throw new Error(`${label} must be between ${min} and ${max}.`);
      return number;
    }

    function save() {
      const trimmed = String(name.value).trim();
      if (!trimmed) {
        error.value = 'The map needs a name.';
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
      store.setMapName(trimmed);
      store.setRespawnPoint(point);
      store.closeDialog();
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
      save,
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
          <span>Project properties</span>
          <button type="button" class="modal-close" title="Close" @click="close"></button>
        </div>
        <form class="modal-body project-properties" @submit.prevent="save">
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
            <button type="submit" class="primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  `,
});
