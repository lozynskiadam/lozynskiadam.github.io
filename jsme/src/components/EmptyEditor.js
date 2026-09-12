import { defineComponent } from '../vendor/vue.esm-browser.prod.js';

/** Stand-in for an editor that has no UI yet - keeps the rail slot alive until the real one lands. */
export default defineComponent({
  name: 'EmptyEditor',
  props: {
    label: { type: String, required: true },
  },
  template: `
    <div class="empty-editor">
      <div class="empty-editor-title">{{ label }} editor</div>
      <div class="empty-editor-hint">Nothing here yet.</div>
    </div>
  `,
});
