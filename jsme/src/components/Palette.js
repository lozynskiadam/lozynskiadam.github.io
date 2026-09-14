import { defineComponent, computed, ref, watch, nextTick } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { searchItems } from '../core/catalog.js';
import ItemGrid from './ItemGrid.js';

/**
 * The map sidebar's item palette, with the same two filters the items
 * editor's list has: a layer (or "all layers") and a free-text needle over
 * name and id. The layer lives in the store as `state.selectedLayer`,
 * because other things reveal an item by switching to it - the search is
 * this component's own, since nothing else has an opinion about it.
 */
export default defineComponent({
  name: 'Palette',
  components: { ItemGrid },
  setup() {
    const gridEl = ref(null);
    const search = ref('');

    // A null layer is "all layers"; the catalog is small enough to scroll through whole.
    const visibleItems = computed(() => {
      const { selectedLayer } = store.state;
      const items = selectedLayer ? store.itemsByLayer.value[selectedLayer] ?? [] : store.catalog.value.items;
      return searchItems(items, search.value);
    });

    function selectLayer(event) {
      store.selectLayer(event.target.value);
      // Hand the keyboard back to the editor, so arrow keys pan the map instead of cycling layers.
      event.target.blur();
    }

    function pickItem(item) {
      store.selectItem(item.id);
      store.selectTool('brush');
    }

    // Whenever the selected item changes (sampler, "Select" in the context
    // menu, or a direct palette click), scroll it into view - selectedLayer
    // is always updated in the same tick by callers that need this, so by
    // the time nextTick() resolves the palette is already showing the right
    // layer's items. A search the item falls outside of is dropped, so
    // there is something to scroll to.
    watch(
      () => store.state.selectedItemId,
      async (id) => {
        if (!id) return;
        if (!visibleItems.value.some((item) => item.id === id)) search.value = '';
        await nextTick();
        gridEl.value?.scrollToSelected();
      },
    );

    return {
      state: store.state,
      layers: store.layers,
      search,
      visibleItems,
      gridEl,
      selectLayer,
      pickItem,
    };
  },
  template: `
    <div class="items-filters">
      <select class="layer-list" :value="state.selectedLayer ?? ''" @change="selectLayer">
        <option value="">all layers</option>
        <option v-for="layer in layers" :key="layer" :value="layer">{{ layer }}</option>
      </select>
      <input type="search" class="items-search" v-model="search" placeholder="name or id" spellcheck="false" />
    </div>
    <ItemGrid ref="gridEl" :items="visibleItems" :selected-id="state.selectedItemId" @pick="pickItem" />
  `,
});
