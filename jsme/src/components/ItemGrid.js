import { defineComponent, ref } from '../vendor/vue.esm-browser.prod.js';

/**
 * The grid of item sprites, shared by the map's palette and the items
 * editor's catalog list. Purely presentational: what to show and what a
 * click means are the parent's business, because the two disagree (the
 * palette also switches to the brush).
 *
 * `scrollToSelected()` is exposed rather than run from a watcher here: both
 * parents first move their own filters so the item is on show at all, and
 * that has to happen before the scroll.
 */
export default defineComponent({
  name: 'ItemGrid',
  props: {
    items: { type: Array, required: true },
    selectedId: { type: String, default: null },
  },
  emits: ['pick'],
  setup(props) {
    const gridEl = ref(null);

    function scrollToSelected() {
      if (!props.selectedId) return;
      gridEl.value?.querySelector(`[data-item-id="${props.selectedId}"]`)?.scrollIntoView({ block: 'nearest' });
    }

    return { gridEl, scrollToSelected };
  },
  template: `
    <div class="palette" ref="gridEl">
      <div
        v-for="item in items"
        :key="item.id"
        class="item-select"
        :data-item-id="item.id"
        :class="{ active: item.id === selectedId }"
        :title="item.name + ' (' + item.id + ')'"
        @click="$emit('pick', item)"
      >
        <img :src="item.src" :alt="item.name" />
      </div>
    </div>
  `,
});
