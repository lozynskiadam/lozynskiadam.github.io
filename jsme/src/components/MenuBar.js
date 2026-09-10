import { defineComponent, ref, watch, onUnmounted } from '../vendor/vue.esm-browser.prod.js';
import { actions } from '../editor.js';
import { MENUS } from '../core/menus.js';
import { primaryShortcutLabel } from '../core/shortcuts.js';

/**
 * Classic application menu bar. Click a title to open its menu; while one
 * is open, hovering another title switches to it (as desktop apps do).
 * Content comes entirely from menus.js + actions.js.
 */
export default defineComponent({
  name: 'MenuBar',
  setup() {
    const barEl = ref(null);
    const openMenuId = ref(null);

    const menus = MENUS.map((menu) => ({
      id: menu.id,
      label: menu.label,
      items: menu.items.map((actionId, index) => {
        if (actionId === null) return { key: `separator-${index}`, separator: true };
        const action = actions[actionId];
        if (!action) throw new Error(`Menu "${menu.id}" references unknown action "${actionId}"`);
        return { key: action.id, action, shortcut: primaryShortcutLabel(action) };
      }),
    }));

    function isEnabled(action) {
      return action.enabled ? action.enabled() : true;
    }

    function toggle(menuId) {
      openMenuId.value = openMenuId.value === menuId ? null : menuId;
    }

    function hover(menuId) {
      if (openMenuId.value !== null) openMenuId.value = menuId;
    }

    function close() {
      openMenuId.value = null;
    }

    function run(action) {
      if (!isEnabled(action)) return;
      close();
      action.run();
    }

    function handleOutsideMouseDown(event) {
      if (!barEl.value?.contains(event.target)) close();
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    }

    watch(openMenuId, (id) => {
      if (id === null) {
        window.removeEventListener('mousedown', handleOutsideMouseDown, true);
        window.removeEventListener('keydown', handleKeydown, true);
      } else {
        window.addEventListener('mousedown', handleOutsideMouseDown, true);
        window.addEventListener('keydown', handleKeydown, true);
      }
    });

    onUnmounted(() => {
      window.removeEventListener('mousedown', handleOutsideMouseDown, true);
      window.removeEventListener('keydown', handleKeydown, true);
    });

    return { barEl, menus, openMenuId, isEnabled, toggle, hover, run };
  },
  template: `
    <nav class="menubar" ref="barEl" role="menubar">
      <div v-for="menu in menus" :key="menu.id" class="menubar-menu">
        <button
          type="button"
          class="menubar-title"
          :class="{ open: openMenuId === menu.id }"
          role="menuitem"
          aria-haspopup="true"
          :aria-expanded="openMenuId === menu.id"
          @mousedown.prevent="toggle(menu.id)"
          @mouseenter="hover(menu.id)"
        >{{ menu.label }}</button>

        <div v-if="openMenuId === menu.id" class="menubar-dropdown" role="menu">
          <template v-for="item in menu.items" :key="item.key">
            <div v-if="item.separator" class="menubar-separator" role="separator"></div>
            <button
              v-else
              type="button"
              class="menubar-item"
              role="menuitem"
              :disabled="!isEnabled(item.action)"
              @click="run(item.action)"
            >
              <span class="menubar-item-icon ui-icon" :data-icon="item.action.icon"></span>
              <span class="menubar-item-label">{{ item.action.label }}</span>
              <span class="menubar-item-shortcut">{{ item.shortcut }}</span>
            </button>
          </template>
        </div>
      </div>
    </nav>
  `,
});
