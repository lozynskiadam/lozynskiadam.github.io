import { defineComponent, computed, ref, watch, nextTick, onUnmounted } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';

export default defineComponent({
  name: 'ContextMenu',
  setup() {
    const menuEl = ref(null);
    const position = ref({ left: 0, top: 0 });

    const menu = computed(() => store.state.contextMenu);
    const item = computed(() => (menu.value ? store.getItem(menu.value.itemId) : null));

    function selectItem() {
      if (!menu.value) return;
      store.selectItemAndReveal(menu.value.itemId);
      store.closeContextMenu();
    }

    function showProperties() {
      if (!menu.value) return;
      const { itemId, x, y, z } = menu.value;
      store.closeContextMenu();
      store.openDialog('itemProperties', { itemId, x, y, z });
    }

    function handleOutsideMouseDown(event) {
      if (!event.target.closest('.context-menu')) store.closeContextMenu();
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') store.closeContextMenu();
    }

    watch(menu, async (value) => {
      if (!value) {
        window.removeEventListener('mousedown', handleOutsideMouseDown, true);
        window.removeEventListener('keydown', handleKeydown);
        return;
      }

      position.value = { left: value.screenX, top: value.screenY };
      window.addEventListener('mousedown', handleOutsideMouseDown, true);
      window.addEventListener('keydown', handleKeydown);

      // Keep the menu on screen even when right-clicking near an edge.
      await nextTick();
      const el = menuEl.value;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      position.value = {
        left: Math.max(4, Math.min(value.screenX, window.innerWidth - rect.width - 4)),
        top: Math.max(4, Math.min(value.screenY, window.innerHeight - rect.height - 4)),
      };
    });

    onUnmounted(() => {
      window.removeEventListener('mousedown', handleOutsideMouseDown, true);
      window.removeEventListener('keydown', handleKeydown);
    });

    return { menuEl, position, menu, item, selectItem, showProperties };
  },
  template: `
    <div
      v-if="menu && item"
      ref="menuEl"
      class="context-menu"
      :style="{ left: position.left + 'px', top: position.top + 'px' }"
    >
      <div class="context-menu-info">{{ item.name }} ({{ item.id }})</div>
      <div class="context-menu-option" @click="selectItem">Select</div>
      <div class="context-menu-option" @click="showProperties">Properties</div>
    </div>
  `,
});
