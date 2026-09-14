import { defineComponent, computed } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';

/**
 * The pair of objects the brush paints with, shown the way a paint program
 * shows its two colors: the primary in front, the secondary peeking out
 * behind it (X swaps them, see `edit.swapItems`). The name line keeps its
 * height even with nothing picked, so the palette below never shifts.
 */
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
      <div class="selected-item-swatches">
        <div class="secondary-item-image" title="Secondary object (X to swap)">
          <img v-if="secondaryItem" :alt="secondaryItem.id" :src="secondaryItem.src" />
        </div>
        <div class="selected-item-image" title="Primary object">
          <img v-if="selectedItem" :alt="selectedItem.id" :src="selectedItem.src" />
        </div>
      </div>
      <div class="selected-item-details">
        <template v-if="selectedItem">
          <div class="selected-item-name" :title="selectedItem.name">{{ selectedItem.name }}</div>
          <div class="selected-item-id">#{{ selectedItem.id }}</div>
        </template>
        <div v-else class="selected-item-empty">No object selected</div>
      </div>
    </div>
  `,
});
