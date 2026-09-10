import { defineComponent, onMounted, onBeforeUnmount, ref, computed } from '../vendor/vue.esm-browser.prod.js';
import { store, renderer, tools, config } from '../editor.js';
import { screenToTile } from '../core/pointer.js';

/**
 * The map viewport: owns the WebGL canvases and translates mouse input
 * into tool callbacks. It never asks for a repaint - the renderer watches
 * the store and redraws on its own.
 */
export default defineComponent({
  name: 'MapCanvas',
  setup() {
    const viewportEl = ref(null);
    const canvasEl = ref(null);
    const rulerHEl = ref(null);
    const rulerVEl = ref(null);
    // Set when the GPU refuses to give us a WebGL context - the map cannot be drawn without one.
    const renderError = ref(null);
    // Reactive so the cursor can switch to a grabbing hand while a drag is in progress.
    const dragging = ref(false);
    let resizeObserver = null;

    const activeTool = computed(() => tools[store.state.selectedTool]);
    const cursorStyle = computed(() => {
      if (dragging.value) {
        const dragCursor = activeTool.value.dragCursor?.();
        if (dragCursor) return dragCursor;
      }
      if (store.state.shiftDown) return 'alias';
      return activeTool.value.cursor || 'default';
    });

    function cursorTile() {
      const { x, y } = store.state.cursorPosition;
      return { x, y, z: store.state.currentFloor };
    }

    function handleMouseMove(event) {
      const tile = screenToTile(event, canvasEl.value, store, config);
      if (!store.setCursorPosition(tile.x, tile.y)) return;
      if (dragging.value) activeTool.value.onDrag?.(cursorTile());
    }

    function handleMouseDown(event) {
      if (event.button === 2) {
        store.selectTool('pointer');
        const { x, y, z } = cursorTile();
        store.highlightOnTile(x, y, z);
        store.openContextMenu(event.clientX, event.clientY, x, y, z);
        return;
      }
      if (event.button !== 0) return;

      activeTool.value.onClick?.(cursorTile());
      // Flipped after onClick so the cursor computed sees the tool's drag state (e.g. an item already picked up).
      dragging.value = true;
    }

    function handleMouseUp() {
      if (!dragging.value) return;
      dragging.value = false;
      activeTool.value.onRelease?.(cursorTile());
    }

    function handleWheel(event) {
      event.preventDefault();
      store.setBrushSize(store.state.brushSize + (event.deltaY < 0 ? 1 : -1));
    }

    onMounted(() => {
      try {
        renderer.attach({ canvas: canvasEl.value, rulerH: rulerHEl.value, rulerV: rulerVEl.value });
      } catch (error) {
        console.error('Failed to initialise the WebGL renderer', error);
        renderError.value = error.message;
      }
      // Observing the viewport (not the window) also catches layout changes that don't resize the window.
      resizeObserver = new ResizeObserver(() => renderer.resize());
      resizeObserver.observe(viewportEl.value);
      // Bound to window (not the canvas) so a drag that ends outside the
      // canvas still stops instead of getting stuck.
      window.addEventListener('mouseup', handleMouseUp);
    });

    onBeforeUnmount(() => {
      resizeObserver?.disconnect();
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.detach();
    });

    return {
      viewportEl,
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
      <div ref="viewportEl" class="map-viewport" :style="{ cursor: cursorStyle }" @wheel="handleWheel">
        <canvas ref="canvasEl" class="map-canvas" @mousemove="handleMouseMove" @mousedown="handleMouseDown"></canvas>
        <div v-if="renderError" class="render-error">{{ renderError }}</div>
      </div>
    </div>
  `,
});
