import { defineComponent, computed } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';

export default defineComponent({
  name: 'SelectedItemPanel',
  setup() {
    return {
      selectedItem: computed(() => store.selectedItem.value),
      secondaryItem: computed(() => store.secondaryItem.value),
    };
  },
  template: `
    <div class="selected-item">
      <div class="selected-item-image">
        <img v-if="selectedItem" :alt="selectedItem.id" :src="selectedItem.src" />
      </div>
      <div class="secondary-item-image">
        <img v-if="secondaryItem" :alt="secondaryItem.id" :src="secondaryItem.src" />
      </div>
      <div class="selected-item-details">
        <template v-if="selectedItem">{{ selectedItem.name }} ({{ selectedItem.id }})</template>
      </div>
    </div>
  `,
});
