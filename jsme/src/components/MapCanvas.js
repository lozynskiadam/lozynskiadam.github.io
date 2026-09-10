import { defineComponent, onMounted, onBeforeUnmount, ref, computed } from '../vendor/vue.esm-browser.prod.js';
import { store, renderer, tools, config } from '../editor.js';
import { screenToTile } from '../core/pointer.js';

export default defineComponent({
  name: 'MapCanvas',
  setup() {
    const canvasEl = ref(null);
    const rulerHEl = ref(null);
    const rulerVEl = ref(null);
    // Set when the GPU refuses to give us a WebGL context - the map cannot be drawn without one.
    const renderError = ref(null);
    // Reactive so the cursor can switch to a grabbing hand while a drag is in progress.
    const dragging = ref(false);

    const activeTool = computed(() => tools[store.state.selectedTool]);
    const cursorStyle = computed(() => {
      if (dragging.value) {
        const dragCursor = activeTool.value.dragCursor?.();
        if (dragCursor) return dragCursor;
      }
      if (store.state.shiftDown) return 'alias';
      return activeTool.value.cursor || 'default';
    });

    function handleMouseMove(event) {
      const tile = screenToTile(event, canvasEl.value, store, config);
      const changed = store.setCursorPosition(tile.x, tile.y);
      if (!changed) return;

      if (dragging.value && activeTool.value.onDrag) {
        activeTool.value.onDrag({ x: tile.x, y: tile.y, z: store.state.currentFloor });
        renderer.render('current');
      } else {
        renderer.render('gui');
      }
    }

    function handleMouseDown(event) {
      if (event.button === 2) {
        store.selectTool('pointer');
        const { x, y } = store.state.cursorPosition;
        const z = store.state.currentFloor;
        store.highlightOnTile(x, y, z);
        store.openContextMenu(event.clientX, event.clientY, x, y, z);
        renderer.render('current');
        return;
      }
      if (event.button !== 0) return;

      const { x, y } = store.state.cursorPosition;
      activeTool.value.onClick?.({ x, y, z: store.state.currentFloor });
      // Flipped after onClick so the cursor computed sees the tool's drag state (e.g. an item already picked up).
      dragging.value = true;
      renderer.render('current');
    }

    function handleMouseUp() {
      if (!dragging.value) return;
      dragging.value = false;
      const { x, y } = store.state.cursorPosition;
      activeTool.value.onRelease?.({ x, y, z: store.state.currentFloor });
      renderer.render('current');
    }

    function handleWheel(event) {
      event.preventDefault();
      store.setBrushSize(store.state.brushSize + (event.deltaY < 0 ? 1 : -1));
      renderer.render('current');
    }

    function handleResize() {
      renderer.resize();
    }

    onMounted(() => {
      try {
        renderer.attach({ canvas: canvasEl.value, rulerH: rulerHEl.value, rulerV: rulerVEl.value });
      } catch (error) {
        console.error('Failed to initialise the WebGL renderer', error);
        renderError.value = error.message;
      }
      window.addEventListener('resize', handleResize);
      // Bound to window (not the canvas) so a drag that ends outside the
      // canvas still stops instead of getting stuck.
      window.addEventListener('mouseup', handleMouseUp);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.detach();
    });

    return {
      canvasEl,
      rulerHEl,
      rulerVEl,
      renderError,
      cursorStyle,
      handleMouseMove,
      handleMouseDown,
      handleWheel,
    };
  },
  template: `
    <div class="content">
      <div class="ruler-corner"></div>
      <canvas ref="rulerHEl" class="ruler ruler-horizontal"></canvas>
      <canvas ref="rulerVEl" class="ruler ruler-vertical"></canvas>
      <div class="map-viewport" :style="{ cursor: cursorStyle }" @wheel="handleWheel">
        <canvas ref="canvasEl" id="map" @mousemove="handleMouseMove" @mousedown="handleMouseDown"></canvas>
        <div v-if="renderError" class="render-error">{{ renderError }}</div>
      </div>
    </div>
  `,
});
