import { defineComponent, computed } from '../vendor/vue.esm-browser.prod.js';
import { store, tools } from '../editor.js';
import { MIN_BRUSH_SIZE, MAX_BRUSH_SIZE } from '../core/store.js';
import { formatShortcut } from '../core/shortcuts.js';

/** "Sampler (5 / hold Tab)" - title plus whatever shortcut/hint the tool declares. */
function tooltipFor(tool) {
  const extras = [tool.shortcut && formatShortcut(tool.shortcut), tool.hint].filter(Boolean);
  return extras.length > 0 ? `${tool.title} (${extras.join(' / ')})` : tool.title;
}

const TOOL_LIST = Object.values(tools).map((tool) => ({ name: tool.name, tooltip: tooltipFor(tool) }));

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
          v-for="tool in tools"
          :key="tool.name"
          type="button"
          class="toolbar-button"
          :class="{ active: state.selectedTool === tool.name }"
          :title="tool.tooltip"
          @click="selectTool(tool.name)"
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

      <div class="toolbar-position">
        <div>X: {{ state.cursorPosition.x }}</div>
        <div>Y: {{ state.cursorPosition.y }}</div>
        <div>Z: {{ state.currentFloor }}</div>
      </div>
    </div>
  `,
});
