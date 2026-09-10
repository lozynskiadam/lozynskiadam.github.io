import { defineComponent } from '../vendor/vue.esm-browser.prod.js';

export default defineComponent({
  name: 'LoadingOverlay',
  template: `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `,
});
