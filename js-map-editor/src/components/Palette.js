import { defineComponent, computed, ref, watch, nextTick } from '../vendor/vue.esm-browser.prod.js';
import { store, renderer } from '../editor.js';

export default defineComponent({
  name: 'Palette',
  setup() {
    const paletteEl = ref(null);

    function selectLayer(event) {
      store.state.selectedLayer = event.target.value;
    }

    function pickItem(item) {
      store.selectItem(item.id);
      store.selectTool('brush');
      renderer.render('current');
    }

    // Whenever the selected item changes (sampler, "Wybierz" in the context
    // menu, or a direct palette click), scroll it into view - selectedLayer
    // is always updated in the same tick by callers that need this, so by
    // the time nextTick() resolves the palette is already showing the right
    // layer's items.
    watch(
      () => store.state.selectedItemId,
      async (id) => {
        if (!id) return;
        await nextTick();
        paletteEl.value?.querySelector(`[data-item-id="${id}"]`)?.scrollIntoView({ block: 'nearest' });
      },
    );

    return {
      state: store.state,
      visibleItems: computed(() => store.itemsByLayer.value[store.state.selectedLayer] ?? []),
      paletteEl,
      selectLayer,
      pickItem,
    };
  },
  template: `
    <select class="layer-list" :value="state.selectedLayer" @change="selectLayer">
      <option v-for="layer in state.layers" :key="layer" :value="layer">{{ layer }}</option>
    </select>
    <div class="palette" ref="paletteEl">
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="item-select"
        :data-item-id="item.id"
        :class="{ active: item.id === state.selectedItemId }"
        :title="item.name + ' (' + item.id + ')'"
        @click="pickItem(item)"
      >
        <img :src="item.src" :alt="item.name" />
      </div>
    </div>
  `,
});
