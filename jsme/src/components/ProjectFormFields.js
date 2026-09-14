import { defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { config } from '../editor.js';

/** The name + respawn point inputs both project dialogs ask for; `fields` comes from useProjectForm. */
export default defineComponent({
  name: 'ProjectFormFields',
  props: {
    fields: { type: Object, required: true },
  },
  setup() {
    return { minFloor: config.minFloor, maxFloor: config.maxFloor };
  },
  template: `
    <label class="project-properties-field">
      <span>Name</span>
      <input type="text" v-model="fields.name" spellcheck="false" autofocus />
    </label>
    <div class="project-properties-field">
      <span>Respawn point</span>
      <div class="project-properties-point">
        <label>X <input type="number" v-model="fields.x" min="0" step="1" /></label>
        <label>Y <input type="number" v-model="fields.y" min="0" step="1" /></label>
        <label>Floor <input type="number" v-model="fields.z" :min="minFloor" :max="maxFloor" step="1" /></label>
      </div>
    </div>
  `,
});
