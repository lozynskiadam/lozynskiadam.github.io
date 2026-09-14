import { defineComponent, computed, ref, watch, onUnmounted } from '../vendor/vue.esm-browser.prod.js';
import { store, workspaceActions } from '../editor.js';
import { MENUS } from '../core/menus.js';
import { isActionEnabled } from '../core/actions.js';
import { primaryShortcutLabel } from '../core/shortcuts.js';

// Not a menu from MENUS: the project switcher shares the bar's open/close state.
const PROJECT_MENU_ID = '@project';

/**
 * Classic application menu bar, above the rail and shared by every editor.
 * Click a title to open its menu; while one is open, hovering another
 * title switches to it (as desktop apps do). Content comes entirely from
 * menus.js + workspaceActions.js.
 *
 * The project switcher on its right shares the same open/close state, so
 * only one dropdown is ever open. Its "Recent projects" list is a mock:
 * the editor holds one project at a time, so the current one is all there
 * is until projects live somewhere they can be listed from. "New project"
 * under that list is real - it opens the dialog that starts one.
 */
export default defineComponent({
  name: 'MenuBar',
  setup() {
    const barEl = ref(null);
    const openMenuId = ref(null);

    const menus = MENUS.map((menu) => ({
      id: menu.id,
      label: menu.label,
      icon: menu.icon ?? null,
      items: menu.items.map((actionId, index) => {
        if (actionId === null) return { key: `separator-${index}`, separator: true };
        const action = workspaceActions[actionId];
        if (!action) throw new Error(`Menu "${menu.id}" references unknown action "${actionId}"`);
        return { key: action.id, action, shortcut: primaryShortcutLabel(action) };
      }),
    }));

    const recentProjects = computed(() => [{ id: 'current', name: store.state.name, current: true }].map(
      (project) => ({ ...project, initial: (project.name.trim()[0] ?? '?').toUpperCase() }),
    ));

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
      if (!isActionEnabled(action)) return;
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

    return {
      barEl,
      menus,
      openMenuId,
      PROJECT_MENU_ID,
      recentProjects,
      newProject: workspaceActions['project.new'],
      isEnabled: isActionEnabled,
      toggle,
      hover,
      run,
      close,
    };
  },
  template: `
    <nav class="menubar" ref="barEl" role="menubar">
      <div v-for="menu in menus" :key="menu.id" class="menubar-menu">
        <button
          type="button"
          class="menubar-title"
          :class="{ open: openMenuId === menu.id, 'menubar-title-icon': menu.icon }"
          role="menuitem"
          aria-haspopup="true"
          :aria-expanded="openMenuId === menu.id"
          :aria-label="menu.label"
          :title="menu.label"
          @mousedown.prevent="toggle(menu.id)"
          @mouseenter="hover(menu.id)"
        ><span v-if="menu.icon" class="ui-icon" :data-icon="menu.icon"></span><template v-else>{{ menu.label }}</template></button>

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

      <div class="menubar-menu menubar-project-menu">
        <button
          type="button"
          class="menubar-project"
          :class="{ open: openMenuId === PROJECT_MENU_ID }"
          aria-haspopup="true"
          :aria-expanded="openMenuId === PROJECT_MENU_ID"
          @mousedown.prevent="toggle(PROJECT_MENU_ID)"
          @mouseenter="hover(PROJECT_MENU_ID)"
        >
          <span class="menubar-project-icon">{{ recentProjects[0].initial }}</span>
          <span class="menubar-project-name">{{ recentProjects[0].name }}</span>
          <span class="menubar-project-chevron"></span>
        </button>

        <div v-if="openMenuId === PROJECT_MENU_ID" class="menubar-dropdown menubar-project-dropdown" role="menu">
          <div class="menubar-dropdown-header">Recent projects</div>
          <button
            v-for="project in recentProjects"
            :key="project.id"
            type="button"
            class="menubar-item menubar-project-item"
            :class="{ current: project.current }"
            role="menuitem"
            @click="close()"
          >
            <span class="menubar-project-icon">{{ project.initial }}</span>
            <span class="menubar-item-label">{{ project.name }}</span>
          </button>

          <div class="menubar-separator" role="separator"></div>
          <button type="button" class="menubar-item" role="menuitem" @click="run(newProject)">
            <span class="menubar-item-icon ui-icon" :data-icon="newProject.icon"></span>
            <span class="menubar-item-label">{{ newProject.label }}</span>
          </button>
        </div>
      </div>
    </nav>
  `,
});
