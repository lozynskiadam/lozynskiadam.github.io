<style>
@import "App.scss";
</style>

<template>
  <Inventory v-if="loaded"/>
  <Equipment v-if="loaded"/>
  <Vitality v-if="loaded"/>
  <DeadDisplay v-if="loaded"/>
  <Loot v-if="loaded"/>
</template>

<script>
import {$hero, globals} from "./utils/globals.ts";
import {emit} from "./utils/common.ts";
import Sprite from "./libs/Sprite.js";
import ItemStructure from "./libs/ItemStructure.ts";
import Effect from "./libs/Effect.ts";
import Keyboard from "./libs/Keyboard.js";
import Pointer from "./libs/Pointer.js";
import Movement from "./libs/Movement.js";
import Renderer from "./libs/Renderer.js";
import Creature from "./libs/Creature.js";
import Board from "./libs/Board.js";
import Connector from "./libs/ConnectorMock.js";
import Equipment from "./components/Equipment.vue";
import Inventory from "./components/Inventory.vue";
import Vitality from "./components/Vitality.vue";
import DeadDisplay from "./components/DeadDisplay.vue";
import Loot from "./components/Loot.vue";
import SoundEffect from "./libs/SoundEffect.js";
import {EFFECTS_PATH, ITEMS_PATH, SPRITES_PATH} from "./config.js";

export default {
  components: {DeadDisplay, Inventory, Equipment, Vitality, Loot},
  data() {
    return {
      loaded: false
    }
  },
  methods: {

    async load() {
      await SoundEffect.load();
      await Sprite.load(SPRITES_PATH);
      await ItemStructure.load(ITEMS_PATH);
      await Effect.load(EFFECTS_PATH);
      await Connector.connect('token');

      this.loaded = true;
    },

    async enter(hero) {
      globals().setHero(hero);
      emit("update-vitals", {health: 100, mana: 50, maxHealth: 100, maxMana: 100});
      Keyboard.init();
      Pointer.init();
      Movement.init();
      Board.init();
      Renderer.init();
      Effect.get('energy').run($hero.position, true);
      SoundEffect.play('login');
    }

  },
  async mounted() {
    await this.load();
    await this.enter(new Creature('Guest', {x: 100, y: 100}));
  }
}
</script>
