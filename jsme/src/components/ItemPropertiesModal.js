import { defineComponent, computed, ref, watch } from '../vendor/vue.esm-browser.prod.js';
import { store, renderer } from '../editor.js';
import { toCamelCase } from '../core/store.js';

export default defineComponent({
  name: 'ItemPropertiesModal',
  setup() {
    const info = computed(() => store.state.itemProperties);
    const item = computed(() => (info.value ? store.getItem(info.value.itemId) : null));

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
      const target = info.value;
      const entry = target ? store.getPlacedEntry(target.x, target.y, target.z, target.itemId) : null;
      properties.value = entry
        ? store.getEntryProperties(entry).map(([key, value]) => ({ key, value: displayValue(value) }))
        : [];
    }

    watch(info, refresh, { immediate: true });

    function commit() {
      refresh();
      renderer.render('current');
    }

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
      const { x, y, z, itemId } = info.value;
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
      const { x, y, z, itemId } = info.value;
      store.setEntryProperty(x, y, z, itemId, property.key, event.target.value);
      commit();
    }

    function removeProperty(property) {
      const { x, y, z, itemId } = info.value;
      store.removeEntryProperty(x, y, z, itemId, property.key);
      commit();
    }

    function normalizeKey() {
      newKey.value = keyPreview.value;
    }

    function close() {
      store.closeItemProperties();
    }

    return {
      info,
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
    };
  },
  template: `
    <div class="modal-overlay" @click.self="close">
      <div class="modal">
        <div class="modal-header">
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
              <dt>X</dt><dd>{{ info.x }}</dd>
              <dt>Y</dt><dd>{{ info.y }}</dd>
              <dt>Z</dt><dd>{{ info.z }}</dd>
            </dl>
          </div>

          <div class="item-properties-custom">
            <div class="item-properties-custom-title">Custom properties</div>
            <div v-if="properties.length === 0" class="item-properties-custom-empty">None yet.</div>
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
