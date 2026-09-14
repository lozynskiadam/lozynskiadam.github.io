import { defineComponent, computed, reactive, ref, watch } from '../vendor/vue.esm-browser.prod.js';
import { store, config } from '../editor.js';
import { DEFAULT_LIGHT, ITEM_TRAITS, isGroundItem, isHexColor } from '../core/catalog.js';
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
    const draft = reactive({ id: '', name: '', layer: '', elevation: 0, lightLevel: 0, lightColor: '' });
    const error = ref('');

    // Every commit replaces the item object, which re-syncs the draft with
    // what was actually stored (normalized values included).
    watch(
      () => props.item,
      (item) => {
        draft.id = item.id;
        draft.name = item.name;
        draft.layer = item.layer;
        draft.elevation = item.elevation;
        // An item that emits nothing still needs something in the two
        // light fields for the moment its checkbox is ticked; the default
        // light is what that tick then stores.
        draft.lightLevel = (item.light ?? DEFAULT_LIGHT).level;
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

    function commitElevation() {
      const elevation = Number(draft.elevation);
      if (!Number.isInteger(elevation) || elevation < 0 || elevation > config.maxElevation) {
        error.value = `The elevation has to be a whole number between 0 and ${config.maxElevation}.`;
        return;
      }
      commit({ elevation });
    }

    /**
     * Light is one field, `{ level, color }` or null, so both inputs
     * commit the pair - the one they did not change taken from the draft,
     * which the watch above keeps in step with the stored light.
     */
    function commitLight(patch) {
      commit({ light: { level: Number(draft.lightLevel), color: draft.lightColor, ...patch } });
    }

    function toggleLight(on) {
      commit({ light: on ? { ...DEFAULT_LIGHT } : null });
    }

    function commitLightLevel() {
      const level = Number(draft.lightLevel);
      if (!Number.isInteger(level) || level < 1 || level > config.maxLightLevel) {
        error.value = `The light level has to be a whole number between 1 and ${config.maxLightLevel}.`;
        return;
      }
      commitLight({ level });
    }

    function commitLightColor() {
      const color = draft.lightColor.trim().toLowerCase();
      if (!isHexColor(color)) {
        error.value = 'The light color has to be a hex value like #ffa500.';
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
      maxElevation: config.maxElevation,
      maxLightLevel: config.maxLightLevel,
      layers: store.layers,
      isGround: computed(() => isGroundItem(props.item)),
      commitId,
      commitName,
      commitLayer,
      commitElevation,
      toggleLight,
      commitLightLevel,
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
          <span>{{ item.bitmap.width }} &times; {{ item.bitmap.height }} px</span>
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
      </div>

      <label class="items-form-field">
        <span>Elevation</span>
        <input type="number" min="0" :max="maxElevation" step="1" v-model="draft.elevation" @change="commitElevation" />
      </label>
      <div class="items-form-hint">
        How high in px this item lifts whatever is stacked on top of it (0–{{ maxElevation }}).
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
      <div v-if="isGround" class="items-form-hint">
        Ground items sit at the bottom of a tile's stack, and a 1&times;1 eraser passes over them.
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
          <span>Level</span>
          <input type="number" min="1" :max="maxLightLevel" step="1" v-model="draft.lightLevel" @change="commitLightLevel" />
        </label>
        <div class="items-form-hint">
          How far in tiles the light reaches (1-{{ maxLightLevel }}).
        </div>

        <div class="items-form-field">
          <span>Color</span>
          <div class="items-form-color">
            <input type="color" v-model="draft.lightColor" @change="commitLightColor" />
            <input type="text" v-model="draft.lightColor" spellcheck="false" maxlength="7" @change="commitLightColor" />
          </div>
        </div>
        <div class="items-form-hint">
          The color the light is tinted with, as hex (#rrggbb).
        </div>
      </template>

      <div v-if="error" class="items-form-error">{{ error }}</div>
    </form>
  `,
});
