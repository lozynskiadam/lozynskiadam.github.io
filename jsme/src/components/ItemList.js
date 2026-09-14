import { defineComponent, computed, ref, watch, nextTick } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { searchItems } from '../core/catalog.js';
import ItemGrid from './ItemGrid.js';

/**
 * The items editor's sidebar: a filter pair (layer, free text) over the
 * whole catalog and the grid of matching items. Clicking one makes it the
 * edited item - which is the same `state.selectedItemId` the map editor
 * paints with, so an item sampled on the map is already open here (and a
 * tweak made here is the item the brush carries back).
 */
export default defineComponent({
  name: 'ItemList',
  components: { ItemGrid },
  setup() {
    const gridEl = ref(null);
    // '' is "all layers": the catalog is small enough to scroll through whole.
    const layer = ref('');
    const search = ref('');

    const matches = computed(() => {
      const items = layer.value ? store.itemsByLayer.value[layer.value] ?? [] : store.catalog.value.items;
      return searchItems(items, search.value);
    });

    function pickItem(item) {
      store.selectItem(item.id);
    }

    // Keeps the edited item in sight: whatever selects it (a click here, the
    // sampler on the map, a freshly added item) and whatever moves it out of
    // the current filter (a changed layer, a renamed item) brings the filter
    // back to something that shows it.
    watch(
      () => [store.state.selectedItemId, store.selectedItem.value?.layer],
      async () => {
        const item = store.selectedItem.value;
        if (!item) return;
        if (layer.value && layer.value !== item.layer) layer.value = item.layer;
        if (!matches.value.includes(item)) search.value = '';
        await nextTick();
        gridEl.value?.scrollToSelected();
      },
      { immediate: true },
    );

    return {
      state: store.state,
      layers: store.layers,
      layer,
      search,
      matches,
      total: computed(() => store.catalog.value.items.length),
      gridEl,
      pickItem,
    };
  },
  template: `
    <div class="items-sidebar">
      <div class="items-filters">
        <select class="layer-list" v-model="layer">
          <option value="">all layers</option>
          <option v-for="name in layers" :key="name" :value="name">{{ name }}</option>
        </select>
        <input type="search" class="items-search" v-model="search" placeholder="name or id" spellcheck="false" />
      </div>
      <ItemGrid ref="gridEl" :items="matches" :selected-id="state.selectedItemId" @pick="pickItem" />
      <div class="items-count">{{ matches.length }} of {{ total }} items</div>
    </div>
  `,
});
