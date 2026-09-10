import { ref, computed } from '../vendor/vue.esm-browser.prod.js';

/**
 * Lets a modal be dragged around by its header. Bind `box` as the template
 * ref of the modal, `style` on the same element and `startDrag` to the
 * header's pointerdown. The modal keeps its centered layout and is offset
 * with a transform, so no absolute positioning is needed.
 */
export function useDraggable() {
  const box = ref(null);
  const offset = ref({ x: 0, y: 0 });

  const style = computed(() => ({
    transform: `translate(${offset.value.x}px, ${offset.value.y}px)`,
  }));

  function startDrag(event) {
    // Buttons in the header (close etc.) keep working as buttons.
    if (event.button !== 0 || event.target.closest('button, input, select, textarea, a')) return;
    const element = box.value;
    if (!element) return;

    const header = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY };
    const origin = { ...offset.value };
    // Horizontally the whole modal has to stay inside the viewport;
    // vertically only the header has to remain reachable.
    const minX = origin.x - rect.left;
    const maxX = origin.x + window.innerWidth - rect.right;
    const minY = origin.y - rect.top;
    const maxY = origin.y + window.innerHeight - rect.top - header.offsetHeight;

    function move(e) {
      offset.value = {
        x: Math.min(maxX, Math.max(minX, origin.x + e.clientX - start.x)),
        y: Math.min(maxY, Math.max(minY, origin.y + e.clientY - start.y)),
      };
    }

    function stop() {
      header.removeEventListener('pointermove', move);
      header.removeEventListener('pointerup', stop);
      header.removeEventListener('pointercancel', stop);
      header.releasePointerCapture(event.pointerId);
      header.classList.remove('dragging');
    }

    event.preventDefault();
    header.setPointerCapture(event.pointerId);
    header.classList.add('dragging');
    header.addEventListener('pointermove', move);
    header.addEventListener('pointerup', stop);
    header.addEventListener('pointercancel', stop);
  }

  return { box, style, startDrag };
}
