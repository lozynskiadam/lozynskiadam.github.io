import { defineComponent, computed, reactive, ref, watch } from '../vendor/vue.esm-browser.prod.js';
import { store, config } from '../editor.js';
import { DEFAULT_LIGHT, ITEM_TRAITS } from '../core/catalog.js';
import { pickImageFile, readImageFile } from '../core/itemsFile.js';

/**
 * Every field of one catalog item (the fields items.json has, nothing
 * else). Text and number fields are a local draft committed on change, so
 * a half-typed value never reaches the catalog and an invalid one can be
 * corrected where it was typed; traits and the image commit straight away.
 *
 * A commit goes through store.updateItem, which rebuilds the catalog - so
 * the item list, the palette and the map redraw with the new values at
 * once, and `state.itemsDirty` reminds that items.json needs saving.
 */
export default defineComponent({
  name: 'ItemForm',
  props: {
    item: { type: Object, required: true },
  },
  setup(props) {
    const draft = reactive({ id: '', name: '', layer: '', altitude: 0, lightRange: 0, lightColor: '' });
    const error = ref('');

    // Every commit replaces the item object, which re-syncs the draft with
    // what was actually stored (normalized values included).
    watch(
      () => props.item,
      (item) => {
        draft.id = item.id;
        draft.name = item.name;
        draft.layer = item.layer;
        draft.altitude = item.altitude;
        // An item that emits nothing still needs something in the two
        // light fields for the moment its checkbox is ticked; the default
        // light is what that tick then stores.
        draft.lightRange = (item.light ?? DEFAULT_LIGHT).range;
        draft.lightColor = (item.light ?? DEFAULT_LIGHT).color;
        error.value = '';
      },
      { immediate: true },
    );

    function commit(patch) {
      error.value = '';
      if (!store.updateItem(props.item.id, patch)) error.value = 'This item is no longer in the catalog.';
    }

    function commitId() {
      const id = Number(draft.id);
      if (!Number.isInteger(id) || id < 0) {
        error.value = 'The ID has to be a whole number, 0 or more.';
        return;
      }
      if (String(id) === props.item.id) return;
      if (store.getItem(id)) {
        error.value = `Item ${id} already exists.`;
        return;
      }
      commit({ id: String(id) });
    }

    function commitName() {
      const name = draft.name.trim();
      if (!name) {
        error.value = 'The item needs a name.';
        return;
      }
      commit({ name });
    }

    function commitLayer() {
      // Layers are just the names the items use, so a new one is made by
      // typing it; lowercase keeps it in line with the existing ones.
      const layer = draft.layer.trim().toLowerCase();
      if (!layer) {
        error.value = 'The item needs a layer.';
        return;
      }
      commit({ layer });
    }

    function commitAltitude() {
      const altitude = Number(draft.altitude);
      if (!Number.isInteger(altitude) || altitude < 0 || altitude > config.maxAltitude) {
        error.value = `The altitude has to be a whole number between 0 and ${config.maxAltitude}.`;
        return;
      }
      commit({ altitude });
    }

    /**
     * Light is one field, `{ range, color }` or null, so both inputs
     * commit the pair - the one they did not change taken from the draft,
     * which the watch above keeps in step with the stored light.
     */
    function commitLight(patch) {
      commit({ light: { range: Number(draft.lightRange), color: draft.lightColor, ...patch } });
    }

    function toggleLight(on) {
      commit({ light: on ? { ...DEFAULT_LIGHT } : null });
    }

    function commitLightRange() {
      const range = Number(draft.lightRange);
      if (!Number.isInteger(range) || range < 1 || range > config.maxLightRange) {
        error.value = `The light range has to be a whole number between 1 and ${config.maxLightRange}.`;
        return;
      }
      commitLight({ range });
    }

    function commitLightColor() {
      const color = draft.lightColor.trim().toLowerCase();
      if (!/^#[0-9a-f]{6}$/.test(color)) {
        error.value = 'The light colour has to be a hex value like #ffa500.';
        return;
      }
      commitLight({ color });
    }

    function toggleTrait(trait, on) {
      const traits = props.item.traits.filter((value) => value !== trait);
      if (on) traits.push(trait);
      commit({ traits });
    }

    async function replaceImage() {
      error.value = '';
      const file = await pickImageFile();
      if (!file) return;
      try {
        await store.setItemImage(props.item.id, await readImageFile(file));
      } catch (failure) {
        error.value = failure.message;
      }
    }

    return {
      draft,
      error,
      traits: ITEM_TRAITS,
      maxAltitude: config.maxAltitude,
      maxLightRange: config.maxLightRange,
      layers: store.layers,
      isGround: computed(() => props.item.layer === 'ground'),
      commitId,
      commitName,
      commitLayer,
      commitAltitude,
      toggleLight,
      commitLightRange,
      commitLightColor,
      toggleTrait,
      replaceImage,
    };
  },
  template: `
    <form class="items-form" @submit.prevent>
      <div class="items-form-image">
        <div class="items-form-preview"><img :src="item.src" :alt="item.name" /></div>
        <div class="items-form-image-info">
          <span>{{ item.image.width }} &times; {{ item.image.height }} px</span>
          <button type="button" @click="replaceImage">Replace image…</button>
        </div>
      </div>

      <label class="items-form-field">
        <span>ID</span>
        <input type="number" min="0" step="1" v-model="draft.id" @change="commitId" />
      </label>
      <div class="items-form-hint">
        Renumbering an item leaves copies already placed on a map pointing at the old ID.
      </div>

      <label class="items-form-field">
        <span>Name</span>
        <input type="text" v-model="draft.name" spellcheck="false" @change="commitName" />
      </label>

      <label class="items-form-field">
        <span>Layer</span>
        <input type="text" list="items-form-layers" v-model="draft.layer" spellcheck="false" @change="commitLayer" />
      </label>
      <datalist id="items-form-layers">
        <option v-for="name in layers" :key="name" :value="name"></option>
      </datalist>
      <div class="items-form-hint">
        The palette tab the item appears on; a brush replaces the item of its own layer on a tile.
        <template v-if="isGround">Ground items sit at the bottom of a tile's stack.</template>
      </div>

      <label class="items-form-field">
        <span>Altitude</span>
        <input type="number" min="0" :max="maxAltitude" step="1" v-model="draft.altitude" @change="commitAltitude" />
      </label>
      <div class="items-form-hint">
        How high in px this item lifts whatever is stacked on top of it (0–{{ maxAltitude }}).
      </div>

      <div class="items-form-field">
        <span>Traits</span>
        <div class="items-form-traits">
          <label v-for="trait in traits" :key="trait">
            <input type="checkbox" :checked="item.traits.includes(trait)" @change="toggleTrait(trait, $event.target.checked)" />
            {{ trait }}
          </label>
        </div>
      </div>

      <div class="items-form-field">
        <span>Light</span>
        <div class="items-form-traits">
          <label>
            <input type="checkbox" :checked="!!item.light" @change="toggleLight($event.target.checked)" />
            emits light
          </label>
        </div>
      </div>
      <div class="items-form-hint">
        Nothing draws it yet - it is the catalog telling the game which items are a light source.
      </div>

      <template v-if="item.light">
        <label class="items-form-field">
          <span>Range</span>
          <input type="number" min="1" :max="maxLightRange" step="1" v-model="draft.lightRange" @change="commitLightRange" />
        </label>
        <div class="items-form-hint">
          How far in tiles the light reaches (1-{{ maxLightRange }}).
        </div>

        <div class="items-form-field">
          <span>Colour</span>
          <div class="items-form-color">
            <input type="color" v-model="draft.lightColor" @change="commitLightColor" />
            <input type="text" v-model="draft.lightColor" spellcheck="false" maxlength="7" @change="commitLightColor" />
          </div>
        </div>
        <div class="items-form-hint">
          The colour the light is tinted with, as hex (#rrggbb).
        </div>
      </template>

      <div v-if="error" class="items-form-error">{{ error }}</div>
    </form>
  `,
});
