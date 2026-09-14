import { defineComponent, computed, nextTick, ref, watch } from '../vendor/vue.esm-browser.prod.js';
import { store } from '../editor.js';
import { searchItems } from '../core/catalog.js';
import { INNER_SLOTS, OUTER_SLOTS, isUsableTerrain } from '../core/terrains.js';
import { TERRAINS_FILE_NAME, downloadTerrainsFile } from '../core/terrainsFile.js';
import Modal from './Modal.js';
import ItemGrid from './ItemGrid.js';

/**
 * "Terrain patterns" dialog: the list of patterns on the left, the edited
 * one on the right as the two grids core/terrains.js describes - the ring
 * around the ground in a 3x3, the concave corners in a 2x2 beside it.
 *
 * A slot is filled by picking it and then clicking an item in the picker
 * below, rather than by typing an id: the palette is behind the dialog, so
 * the dialog brings its own (the same ItemGrid, with the same layer and
 * text filters).
 *
 * Saving is its own button for the same reason the items editor has one:
 * the patterns are the project's terrains.json, a separate file from the
 * map (see core/terrainsFile.js).
 */

/** The 3x3 the outer slots are laid out in; null is the middle cell, which shows the pattern's ground. */
const OUTER_CELLS = [OUTER_SLOTS[0], OUTER_SLOTS[1], OUTER_SLOTS[2], OUTER_SLOTS[3], null, ...OUTER_SLOTS.slice(4)];

const SLOT_TITLES = {
  nw: 'north-west',
  n: 'north',
  ne: 'north-east',
  w: 'west',
  e: 'east',
  sw: 'south-west',
  s: 'south',
  se: 'south-east',
};

export default defineComponent({
  name: 'TerrainsModal',
  components: { Modal, ItemGrid },
  setup() {
    const selectedId = ref(store.state.terrains[0]?.id ?? null);
    // Which slot the picker assigns to: the ground of the 3x3 by default,
    // so clicking an item always does something.
    const target = ref({ group: 'ground', slot: null });
    const name = ref('');
    const layer = ref('');
    const search = ref('');

    const terrain = computed(() => (selectedId.value === null ? null : store.getTerrain(selectedId.value)));

    // Every edit rewrites the pattern in place, so the name field is a
    // draft re-read whenever another pattern is picked.
    watch(
      terrain,
      (current) => {
        name.value = current?.name ?? '';
        target.value = { group: 'ground', slot: null };
      },
      { immediate: true },
    );

    const pickerEl = ref(null);
    const matches = computed(() => {
      const items = layer.value ? store.itemsByLayer.value[layer.value] ?? [] : store.catalog.value.items;
      return searchItems(items, search.value);
    });

    /** What the picked slot holds right now, so the picker marks it and scrolls to it. */
    const targetItemId = computed(() => {
      const current = terrain.value;
      if (!current) return null;
      return target.value.group === 'ground' ? current.groundId : current[target.value.group][target.value.slot];
    });

    // Picking another slot brings its item into view, the way selecting an
    // item does in the palette and the items editor.
    watch(targetItemId, async (id) => {
      if (!id) return;
      await nextTick();
      pickerEl.value?.scrollToSelected();
    });

    /** The ground item of any pattern - the swatch each row in the list shows. */
    function groundOf(pattern) {
      return store.getItem(pattern.groundId);
    }

    /** The item in a slot, for the little sprite each cell shows. */
    function slotItem(group, slot) {
      const current = terrain.value;
      if (!current) return null;
      return store.getItem(group === 'ground' ? current.groundId : current[group][slot]);
    }

    function isTarget(group, slot) {
      return target.value.group === group && target.value.slot === slot;
    }

    function pickSlot(group, slot) {
      target.value = { group, slot };
    }

    function assign(itemId) {
      const current = terrain.value;
      if (!current) return;
      const { group, slot } = target.value;
      store.updateTerrain(current.id, group === 'ground' ? { groundId: itemId } : { [group]: { [slot]: itemId } });
    }

    function clearSlot() {
      assign(null);
    }

    function commitName() {
      if (terrain.value) store.updateTerrain(terrain.value.id, { name: name.value.trim() || 'unnamed' });
    }

    function addTerrain() {
      selectedId.value = store.addTerrain();
    }

    function removeTerrain() {
      const current = terrain.value;
      if (!current) return;
      if (!confirm(`Delete the "${current.name}" pattern? Edges already on the map stay where they are.`)) return;
      store.removeTerrain(current.id);
      selectedId.value = store.state.terrains[0]?.id ?? null;
    }

    function save() {
      downloadTerrainsFile(store.exportTerrains());
      store.markTerrainsSaved();
    }

    return {
      state: store.state,
      layers: store.layers,
      terrain,
      selectedId,
      target,
      name,
      layer,
      search,
      matches,
      pickerEl,
      targetItemId,
      outerCells: OUTER_CELLS,
      innerSlots: INNER_SLOTS,
      slotTitles: SLOT_TITLES,
      fileName: TERRAINS_FILE_NAME,
      isUsable: isUsableTerrain,
      groundOf,
      slotItem,
      isTarget,
      pickSlot,
      assign,
      clearSlot,
      commitName,
      addTerrain,
      removeTerrain,
      save,
    };
  },
  template: `
    <Modal title="Terrain patterns" class="terrains-modal">
      <div class="modal-body terrains">
        <div class="terrains-list">
          <div class="terrains-list-items">
            <button
              v-for="pattern in state.terrains"
              :key="pattern.id"
              type="button"
              class="terrains-list-item"
              :class="{ active: pattern.id === selectedId }"
              @click="selectedId = pattern.id"
            >
              <span class="terrains-swatch">
                <img v-if="groundOf(pattern)" :src="groundOf(pattern).src" alt="" />
              </span>
              <span class="terrains-list-name">{{ pattern.name || 'unnamed' }}</span>
              <span v-if="!isUsable(pattern)" class="terrains-list-note" title="Give it a ground item and at least one edge">draft</span>
            </button>
            <div v-if="state.terrains.length === 0" class="terrains-list-empty">No patterns yet.</div>
          </div>
          <div class="terrains-list-actions">
            <button type="button" @click="addTerrain">New pattern</button>
            <button type="button" :disabled="!terrain" @click="removeTerrain">Delete</button>
          </div>
        </div>

        <div v-if="terrain" class="terrains-detail">
          <label class="terrains-field">
            <span>Name</span>
            <input type="text" v-model="name" spellcheck="false" @change="commitName" />
          </label>

          <div class="terrains-grids">
            <div class="terrains-grid-block">
              <div class="terrains-grid-title">Ground &amp; outer edges</div>
              <div class="terrains-grid terrains-grid-outer">
                <button
                  v-for="(slot, index) in outerCells"
                  :key="index"
                  type="button"
                  class="terrains-slot"
                  :class="{ active: isTarget(slot === null ? 'ground' : 'outer', slot), ground: slot === null }"
                  :title="slot === null ? 'Ground item' : slotTitles[slot] + ' edge'"
                  @click="pickSlot(slot === null ? 'ground' : 'outer', slot)"
                >
                  <img v-if="slotItem(slot === null ? 'ground' : 'outer', slot)" :src="slotItem(slot === null ? 'ground' : 'outer', slot).src" alt="" />
                  <span v-else class="terrains-slot-empty">{{ slot === null ? 'gnd' : slot }}</span>
                </button>
              </div>
            </div>

            <div class="terrains-grid-block">
              <div class="terrains-grid-title">Inner corners</div>
              <div class="terrains-grid terrains-grid-inner">
                <button
                  v-for="slot in innerSlots"
                  :key="slot"
                  type="button"
                  class="terrains-slot"
                  :class="{ active: isTarget('inner', slot) }"
                  :title="slotTitles[slot] + ' inner corner'"
                  @click="pickSlot('inner', slot)"
                >
                  <img v-if="slotItem('inner', slot)" :src="slotItem('inner', slot).src" alt="" />
                  <span v-else class="terrains-slot-empty">{{ slot }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="terrains-hint">
            Each slot holds the item drawn on the tile at that side of the terrain - the middle one is the
            ground the brush paints. Inner corners fill the notch where the terrain bends around a tile;
            an empty one falls back to the two edges beside it.
          </div>

          <div class="terrains-picker">
            <div class="terrains-picker-head">
              <span class="terrains-picker-target">
                Pick an item for:
                <strong>{{ target.group === 'ground' ? 'ground' : slotTitles[target.slot] + ' ' + target.group }}</strong>
              </span>
              <button type="button" class="terrains-picker-clear" @click="clearSlot">Clear slot</button>
            </div>
            <div class="items-filters">
              <select class="layer-list" v-model="layer">
                <option value="">all layers</option>
                <option v-for="option in layers" :key="option" :value="option">{{ option }}</option>
              </select>
              <input type="search" class="items-search" v-model="search" placeholder="name or id" spellcheck="false" />
            </div>
            <ItemGrid ref="pickerEl" :items="matches" :selected-id="targetItemId" @pick="assign($event.id)" />
          </div>
        </div>
        <div v-else class="terrains-detail terrains-empty">
          A pattern is a ground item plus the edges that surround it. Add one to start.
        </div>
      </div>

      <div class="terrains-footer">
        <span v-if="state.terrainsDirty" class="items-unsaved" :title="fileName + ' has unsaved changes'">unsaved changes</span>
        <button type="button" @click="save">Save {{ fileName }}</button>
      </div>
    </Modal>
  `,
});
