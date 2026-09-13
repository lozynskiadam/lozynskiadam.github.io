import { defineComponent, computed, ref } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { downloadItemsFile, ITEMS_FILE_NAME } from '../core/itemsFile.js';
import LoadingOverlay from './LoadingOverlay.js';
import ItemList from './ItemList.js';
import ItemForm from './ItemForm.js';

/**
 * The items editor as a whole: the catalog on the left, every field of the
 * picked item on the right, and the catalog-wide commands (add, delete,
 * save) in its toolbar. It edits the same catalog the map editor draws
 * from, so a change here is visible on the map the moment it is made.
 *
 * Saving is its own command rather than File → Save: that one writes the
 * map file, while the catalog is the project's items.json, a separate file
 * on disk (see core/itemsFile.js).
 *
 * Laid out like the map editor: the catalog card on the left, and the
 * toolbar plus the edited item in one `.items-panel` card next to it.
 */
export default defineComponent({
  name: 'ItemsEditor',
  components: { LoadingOverlay, ItemList, ItemForm },
  setup() {
    const error = ref('');
    const item = computed(() => store.selectedItem.value);

    async function addItem() {
      error.value = '';
      try {
        store.selectItem(await store.addItem());
      } catch (failure) {
        error.value = failure.message;
      }
    }

    function removeItem() {
      const current = item.value;
      if (!current) return;
      const message = `Delete item ${current.id} (${current.name})? Copies already placed on a map stop showing.`;
      if (!confirm(message)) return;
      store.removeItem(current.id);
    }

    function save() {
      downloadItemsFile(store.exportItems());
      store.markItemsSaved();
    }

    return { state: store.state, item, error, fileName: ITEMS_FILE_NAME, addItem, removeItem, save };
  },
  template: `
    <div class="items-editor">
      <LoadingOverlay v-if="state.loading" />
      <template v-else>
        <ItemList />

        <div class="items-panel">
          <div class="toolbar">
            <div class="toolbar-buttons">
              <button type="button" class="text-button" @click="addItem">New item</button>
              <button type="button" class="text-button" :disabled="!item" @click="removeItem">Delete item</button>
              <div class="toolbar-separator"></div>
              <button type="button" class="text-button" @click="save">Save {{ fileName }}</button>
            </div>
            <div class="toolbar-status">
              <span v-if="state.itemsDirty" class="items-unsaved" :title="fileName + ' has unsaved changes'">unsaved changes</span>
            </div>
          </div>

          <div class="items-detail">
            <ItemForm v-if="item" :item="item" />
            <div v-else class="items-detail-empty">Pick an item on the left to edit it.</div>
            <div v-if="error" class="items-form-error">{{ error }}</div>
          </div>
        </div>
      </template>
    </div>
  `,
});
