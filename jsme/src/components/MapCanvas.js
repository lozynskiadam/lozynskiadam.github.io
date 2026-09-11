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
    // Middle-button drag scrolls the map: the pointer "grabs" the map and
    // pulls it along. The view only moves in whole tiles, so pointer
    // movement is accumulated here until a full tile's worth is collected.
    const panning = ref(false);
    let panLastX = 0;
    let panLastY = 0;
    let panRestX = 0;
    let panRestY = 0;
    // Whether the mouse has moved (by any amount) since the button went down;
    // the first such move is reported to the tool as onDragStart.
    let dragStarted = false;
    // Bumped after every tool callback made mid-drag: tools keep their drag
    // state outside the store, so this is what makes cursorStyle re-read it.
    const dragTick = ref(0);
    let resizeObserver = null;

    const activeTool = computed(() => tools[store.state.selectedTool]);
    const cursorStyle = computed(() => {
      if (panning.value) return 'grabbing';
      if (dragging.value) {
        void dragTick.value; // read only to register the dependency
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
      if (dragging.value && !dragStarted) {
        // Any pointer movement while the button is held starts the drag,
        // even before the cursor reaches another tile.
        dragStarted = true;
        activeTool.value.onDragStart?.(cursorTile());
        dragTick.value++;
      }
      if (!store.setCursorPosition(tile.x, tile.y)) return;
      if (dragging.value) {
        activeTool.value.onDrag?.(cursorTile());
        dragTick.value++;
      }
    }

    function handlePanMove(event) {
      if (!panning.value) return;
      panRestX += event.clientX - panLastX;
      panRestY += event.clientY - panLastY;
      panLastX = event.clientX;
      panLastY = event.clientY;

      // Dragging the map right reveals what lies to the left, hence the sign flip.
      const tilePx = store.tilePx();
      const stepsX = Math.trunc(panRestX / tilePx);
      const stepsY = Math.trunc(panRestY / tilePx);
      if (stepsX === 0 && stepsY === 0) return;
      store.pan(-stepsX, -stepsY);
      panRestX -= stepsX * tilePx;
      panRestY -= stepsY * tilePx;
      // At the map's edge the pointer keeps moving but the map cannot follow;
      // drop that surplus so the map does not lag behind when the drag reverses.
      if (store.state.renderFromX === 0 && panRestX > 0) panRestX = 0;
      if (store.state.renderFromY === 0 && panRestY > 0) panRestY = 0;
    }

    function handleMouseDown(event) {
      if (event.button === 1) {
        // Also keeps the browser's own middle-click autoscroll out of the way.
        event.preventDefault();
        panning.value = true;
        panLastX = event.clientX;
        panLastY = event.clientY;
        panRestX = 0;
        panRestY = 0;
        return;
      }
      if (event.button === 2) {
        store.selectTool('pointer');
        const { x, y, z } = cursorTile();
        store.highlightOnTile(x, y, z);
        store.openContextMenu(event.clientX, event.clientY, x, y, z);
        return;
      }
      if (event.button !== 0) return;

      // Everything the tool does until the button is released is one undo step.
      store.beginGesture();
      activeTool.value.onClick?.(cursorTile());
      // Flipped after onClick so the cursor computed sees the tool's drag state (e.g. a selection already picked up).
      dragStarted = false;
      dragging.value = true;
    }

    function handleMouseUp(event) {
      if (event.button === 1) {
        panning.value = false;
        return;
      }
      if (!dragging.value) return;
      dragging.value = false;
      dragStarted = false;
      activeTool.value.onRelease?.(cursorTile());
      store.endGesture();
    }

    function handleWheel(event) {
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      // Ctrl+wheel zooms (also swallowing the browser's page zoom), as does the
      // wheel while the middle button is held for panning - the hand is already
      // on the map, so it reads as "move around", not as a brush change.
      // A plain wheel sizes the brush.
      if (event.ctrlKey || event.metaKey || panning.value) {
        store.stepZoom(direction);
        return;
      }
      store.setBrushSize(store.state.brushSize + direction);
    }

    onMounted(() => {
      try {
        renderer.attach({ canvas: canvasEl.value, rulerH: rulerHEl.value, rulerV: rulerVEl.value });
        // attach() measured the viewport, so the respawn point can be centered now.
        store.centerOnRespawn();
      } catch (error) {
        console.error('Failed to initialise the WebGL renderer', error);
        renderError.value = error.message;
      }
      // Observing the viewport (not the window) also catches layout changes that don't resize the window.
      resizeObserver = new ResizeObserver(() => renderer.resize());
      resizeObserver.observe(viewportEl.value);
      // Bound to window (not the canvas) so a drag that ends outside the
      // canvas still stops instead of getting stuck, and a middle-button
      // pan keeps following the pointer past the canvas edge.
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handlePanMove);
    });

    onBeforeUnmount(() => {
      resizeObserver?.disconnect();
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handlePanMove);
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
