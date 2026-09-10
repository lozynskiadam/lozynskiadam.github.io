import { defineComponent, computed, ref, watch } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { toCamelCase } from '../core/store.js';
import { useDraggable } from '../composables/useDraggable.js';

/** "Properties" dialog for one placed item, opened via store.openDialog('itemProperties', { itemId, x, y, z }). */
export default defineComponent({
  name: 'ItemPropertiesModal',
  props: {
    itemId: { type: [Number, String], required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  setup(props) {
    const { box, style, startDrag } = useDraggable();
    const item = computed(() => store.getItem(props.itemId));

    // The map data itself is not reactive (see store.js), so the custom
    // property list is a snapshot re-read after every edit.
    const properties = ref([]);
    const newKey = ref('');
    const newValue = ref('');
    const error = ref('');
    // What the typed key will actually be saved as - shown live so the
    // camelCase rule never surprises anyone.
    const keyPreview = computed(() => toCamelCase(newKey.value));

    function displayValue(value) {
      return typeof value === 'string' ? value : JSON.stringify(value);
    }

    function refresh() {
      const entry = store.getPlacedEntry(props.x, props.y, props.z, props.itemId);
      properties.value = entry
        ? store.getEntryProperties(entry).map(([key, value]) => ({ key, value: displayValue(value) }))
        : [];
    }

    watch(() => [props.itemId, props.x, props.y, props.z], refresh, { immediate: true });

    // Mutations go through the store, which flags the floor for the renderer; only the local snapshot needs refreshing.
    const commit = refresh;

    function addProperty() {
      const key = keyPreview.value;
      if (!key) {
        error.value = 'The key needs at least one letter.';
        return;
      }
      if (key === 'id') {
        error.value = '"id" is reserved for the item type.';
        return;
      }
      const { x, y, z, itemId } = props;
      if (!store.setEntryProperty(x, y, z, itemId, key, newValue.value)) {
        error.value = 'This item is no longer on the map.';
        return;
      }
      newKey.value = '';
      newValue.value = '';
      error.value = '';
      commit();
    }

    function updateProperty(property, event) {
      const { x, y, z, itemId } = props;
      store.setEntryProperty(x, y, z, itemId, property.key, event.target.value);
      commit();
    }

    function removeProperty(property) {
      const { x, y, z, itemId } = props;
      store.removeEntryProperty(x, y, z, itemId, property.key);
      commit();
    }

    function normalizeKey() {
      newKey.value = keyPreview.value;
    }

    function close() {
      store.closeDialog();
    }

    return {
      item,
      properties,
      newKey,
      newValue,
      keyPreview,
      error,
      addProperty,
      updateProperty,
      removeProperty,
      normalizeKey,
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
          <span>Item properties</span>
          <button type="button" class="modal-close" title="Close" @click="close"></button>
        </div>
        <div v-if="item" class="modal-body">
          <div class="item-properties">
            <div class="item-properties-preview">
              <img :src="item.src" :alt="item.name" />
            </div>
            <dl class="item-properties-details">
              <dt>Name</dt><dd>{{ item.name }}</dd>
              <dt>ID</dt><dd>{{ item.id }}</dd>
              <dt>Pos</dt><dd>{{ x }}, {{ y }}, {{ z }}</dd>
            </dl>
          </div>

          <div class="item-properties-custom">
            <div v-for="property in properties" :key="property.key" class="item-properties-row">
              <code class="item-properties-key" :title="property.key">{{ property.key }}</code>
              <input type="text" :value="property.value" @change="updateProperty(property, $event)" />
              <button type="button" title="Remove" @click="removeProperty(property)">&times;</button>
            </div>
            <form class="item-properties-row" @submit.prevent="addProperty">
              <input type="text" v-model="newKey" placeholder="key" spellcheck="false" @blur="normalizeKey" />
              <input type="text" v-model="newValue" placeholder="value" />
              <button type="submit" title="Add">+</button>
            </form>
            <div v-if="keyPreview && keyPreview !== newKey" class="item-properties-hint">
              Saved as <code>{{ keyPreview }}</code>
            </div>
            <div v-if="error" class="item-properties-error">{{ error }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
});
