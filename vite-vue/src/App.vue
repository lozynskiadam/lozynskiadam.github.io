<template>

</template>

<script>
import {$hero, setHero} from "./utils/globals.js";
import Sprite from "./libs/Sprite.js";
import Item from "./libs/Item.js";
import Effect from "./libs/Effect.js";
import Keyboard from "./libs/Keyboard.js";
import Mouse from "./libs/Mouse.js";
import Movement from "./libs/Movement.js";
import Renderer from "./libs/Renderer.js";
import Creature from "./libs/Creature.js";
import Board from "./libs/Board.js";

export default {
  methods: {

    async load() {
      await Sprite.load();
      await Item.load();
      await Effect.load();
    },

    async enter(hero) {
      setHero(hero);
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
    await this.enter(new Creature('Nemnes', {x: 100, y: 100}, {x: 0, y: 0}));
  }
}
</script>
