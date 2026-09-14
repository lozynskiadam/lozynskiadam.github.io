import { defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { useDraggable } from '../composables/useDraggable.js';

/**
 * The shell every dialog shares: the dimmed overlay that closes on a click
 * beside the box, the draggable title bar and its close button. A dialog
 * supplies only its body, which is expected to carry `.modal-body`:
 *
 *   <Modal title="…"><div class="modal-body">…</div></Modal>
 *
 * Closing goes through the store, since the open dialog is store state
 * (see store.openDialog) - so a dialog body never has to pass one down.
 */
export default defineComponent({
  name: 'Modal',
  props: {
    title: { type: String, required: true },
  },
  setup() {
    const { box, style, startDrag } = useDraggable();

    function close() {
      store.closeDialog();
    }

    return { box, style, startDrag, close };
  },
  template: `
    <div class="modal-overlay" @click.self="close">
      <div class="modal" ref="box" :style="style">
        <div class="modal-header" @pointerdown="startDrag">
          <span>{{ title }}</span>
          <button type="button" class="modal-close" title="Close" @click="close"></button>
        </div>
        <slot></slot>
      </div>
    </div>
  `,
});
