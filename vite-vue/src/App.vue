<style>
@import "App.scss";
</style>

<template>
  <Inventory v-if="loaded"/>
  <Vitality v-if="loaded"/>
</template>

<script>
import {$hero, globals} from "./utils/globals.js";
import Sprite from "./libs/Sprite.js";
import Item from "./libs/Item.js";
import Effect from "./libs/Effect.js";
import Keyboard from "./libs/Keyboard.js";
import Mouse from "./libs/Mouse.js";
import Movement from "./libs/Movement.js";
import Renderer from "./libs/Renderer.js";
import Creature from "./libs/Creature.js";
import Board from "./libs/Board.js";
import Connector from "./libs/Connector.js";
import Inventory from "./components/Inventory.vue";
import Vitality from "./components/Vitality.vue";

export default {
  components: {Inventory, Vitality},
  data() {
    return {
      loaded: false
    }
  },
  methods: {

    async load() {
      await Sprite.load();
      await Item.load();
      await Effect.load();
      Connector.connect('');

      this.loaded = true;
    },

    async enter(hero) {
      globals().setHero(hero);
      window.dispatchEvent(new CustomEvent("update-vitals", {detail: {
        health: 100,
        mana: 100,
        maxHealth: 100,
        maxMana: 100
      }}));
      Keyboard.init();
      Mouse.init();
      Movement.init();
      Board.init();
      Renderer.render();
      Effect.get('energy').run($hero.position);
    }

  },
  async mounted() {
    await this.load();
    await this.enter(new Creature('Nemnes', {x: 100, y: 100}));
  }
}
</script>
