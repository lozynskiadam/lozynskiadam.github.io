import { defineComponent } from '../vendor/vue.esm-browser.prod.js';
import SelectedItemPanel from './SelectedItemPanel.js';
import Palette from './Palette.js';

export default defineComponent({
  name: 'Sidebar',
  components: { SelectedItemPanel, Palette },
  template: `
    <div class="sidebar">
      <SelectedItemPanel />
      <Palette />
    </div>
  `,
});
