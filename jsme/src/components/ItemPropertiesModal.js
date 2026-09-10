import { defineComponent, computed } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';

export default defineComponent({
  name: 'ItemPropertiesModal',
  setup() {
    const info = computed(() => store.state.itemProperties);
    const item = computed(() => (info.value ? store.getItem(info.value.itemId) : null));

    function close() {
      store.closeItemProperties();
    }

    return { info, item, close };
  },
  template: `
    <div class="modal-overlay" @click.self="close">
      <div class="modal">
        <div class="modal-header">
          <span>Item properties</span>
          <button type="button" class="modal-close" title="Close" @click="close"></button>
        </div>
        <div v-if="item" class="modal-body item-properties">
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
      </div>
    </div>
  `,
});
