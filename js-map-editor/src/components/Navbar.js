import { defineComponent, computed } from '../vendor/vue.esm-browser.prod.js';
import { store, renderer, tools } from '../editor.js';

const TOOL_LIST = Object.values(tools);

export default defineComponent({
  name: 'Navbar',
  setup() {
    function newMap() {
      store.newMap();
      renderer.render('all');
    }

    function openMap() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        store
          .openMap(file)
          .then(() => renderer.render('all'))
          .catch(() => alert('Selected file is not a valid map editor file'));
      });
      input.click();
    }

    function saveMap() {
      store.saveMap();
    }

    function toggleHelp() {
      store.state.showHelp = !store.state.showHelp;
    }

    function selectTool(name) {
      store.selectTool(name);
      renderer.render('current');
    }

    function onBrushSizeInput(event) {
      store.setBrushSize(Number(event.target.value));
      renderer.render('current');
    }

    return {
      tools: TOOL_LIST,
      state: store.state,
      isSizingTool: computed(() => tools[store.state.selectedTool]?.sizing ?? false),
      newMap,
      openMap,
      saveMap,
      toggleHelp,
      selectTool,
      onBrushSizeInput,
    };
  },
  template: `
    <div class="navbar">
      <div class="menu-buttons">
        <div data-action="new" class="menu-button" title="New" @click="newMap"><span></span></div>
        <div data-action="open" class="menu-button" title="Open" @click="openMap"><span></span></div>
        <div data-action="save" class="menu-button" title="Save" @click="saveMap"><span></span></div>
        <div data-action="help" class="menu-button" title="Help" @click="toggleHelp"><span></span></div>

        <div class="menu-separator"></div>

        <div
          v-for="tool in tools"
          :key="tool.name"
          :data-tool="tool.name"
          class="menu-button"
          :class="{ active: state.selectedTool === tool.name }"
          :title="tool.title"
          @click="selectTool(tool.name)"
        ><span></span></div>

        <div class="menu-separator"></div>

        <input
          v-show="isSizingTool"
          type="range"
          min="1"
          max="4"
          :value="state.brushSize"
          class="menu-button slider"
          title="Brush size (+/-)"
          @input="onBrushSizeInput"
        />
      </div>

      <div class="pos">
        <div class="pos-x">X: {{ state.cursorPosition.x }}</div>
        <div class="pos-y">Y: {{ state.cursorPosition.y }}</div>
        <div class="pos-z">Z: {{ state.currentFloor }}</div>
      </div>
    </div>
  `,
});
