import { defineComponent, computed } from '../vendor/vue.esm-browser.prod.js';
import { store, tools, actions } from '../editor.js';
import { isActionEnabled } from '../core/actions.js';
import { MIN_BRUSH_SIZE, MAX_BRUSH_SIZE } from '../core/store.js';
import { TOOLBAR_ACTIONS } from '../core/menus.js';
import { formatShortcut, primaryShortcutLabel } from '../core/shortcuts.js';

/** "Sampler (5 / hold Tab)" - title plus whatever shortcut/hint the tool declares. */
function tooltipFor(tool) {
  const extras = [tool.shortcut && formatShortcut(tool.shortcut), tool.hint].filter(Boolean);
  return extras.length > 0 ? `${tool.title} (${extras.join(' / ')})` : tool.title;
}

const TOOL_LIST = Object.values(tools).map((tool) => ({ name: tool.name, tooltip: tooltipFor(tool) }));

const ACTION_LIST = TOOLBAR_ACTIONS.map((id) => {
  const action = actions[id];
  if (!action) throw new Error(`Toolbar references unknown action "${id}"`);
  const shortcut = primaryShortcutLabel(action);
  return { action, tooltip: shortcut ? `${action.label} (${shortcut})` : action.label };
});

/**
 * The map editor's toolbar. Its buttons refuse focus the way the rail's do:
 * shortcuts live on window, and a button that kept focus after a click would
 * show a focus ring as soon as the next one is pressed.
 */
export default defineComponent({
  name: 'Toolbar',
  setup() {
    function selectTool(name) {
      store.selectTool(name);
    }

    function onBrushSizeInput(event) {
      store.setBrushSize(Number(event.target.value));
    }

    return {
      tools: TOOL_LIST,
      actionButtons: ACTION_LIST,
      isEnabled: isActionEnabled,
      state: store.state,
      minBrushSize: MIN_BRUSH_SIZE,
      maxBrushSize: MAX_BRUSH_SIZE,
      isSizingTool: computed(() => tools[store.state.selectedTool]?.sizing ?? false),
      selectTool,
      onBrushSizeInput,
    };
  },
  template: `
    <div class="toolbar">
      <div class="toolbar-buttons">
        <button
          v-for="button in actionButtons"
          :key="button.action.id"
          type="button"
          class="toolbar-button"
          :title="button.tooltip"
          :disabled="!isEnabled(button.action)"
          @click="button.action.run()"
          @mousedown.prevent
        ><span class="ui-icon" :data-icon="button.action.icon"></span></button>

        <div class="toolbar-separator"></div>

        <button
          v-for="tool in tools"
          :key="tool.name"
          type="button"
          class="toolbar-button"
          :class="{ active: state.selectedTool === tool.name }"
          :title="tool.tooltip"
          @click="selectTool(tool.name)"
          @mousedown.prevent
        ><span class="ui-icon" :data-icon="tool.name"></span></button>

        <div class="toolbar-separator"></div>

        <input
          v-show="isSizingTool"
          type="range"
          :min="minBrushSize"
          :max="maxBrushSize"
          :value="state.brushSize"
          class="toolbar-slider"
          title="Brush size (+/-)"
          @input="onBrushSizeInput"
        />
      </div>

      <div class="toolbar-status">
        <span title="Zoom (Ctrl+wheel, Ctrl++ / Ctrl+-)">Zoom: {{ Math.round(state.zoom * 100) }}%</span>
        <span class="toolbar-position">Pos: {{ state.cursorPosition.x }},{{ state.cursorPosition.y }},{{ state.currentFloor }}</span>
      </div>
    </div>
  `,
});
