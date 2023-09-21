<template>
  <Board ref="board"/>
</template>

<script>
import {EFFECTS_PATH, ITEMS_PATH, SPRITES_PATH} from "./config.js";
import {$board, $hero, setBoard, setHero} from "./utils/globals.js";
import Board from './components/Board.vue'
import Sprite from "./libs/Sprite.js";
import Item from "./libs/Item.js";
import Effect from "./libs/Effect.js";
import Keyboard from "./libs/Keyboard.js";
import Mouse from "./libs/Mouse.js";
import Movement from "./libs/Movement.js";
import Renderer from "./libs/Renderer.js";
import Creature from "./libs/Creature.js";

export default {
  components: {Board},
  methods: {

    async load() {
      await Sprite.load(SPRITES_PATH);
      await Item.load(ITEMS_PATH);
      await Effect.load(EFFECTS_PATH);
    },

    async enter(hero) {
      setHero(hero);
      Keyboard.init();
      Mouse.init();
      Movement.init();
      $board.refresh();
      Renderer.render();
      Effect.get('energy').run($hero.position);
    }

  },
  async mounted() {
    setBoard(this.$refs.board);

    await this.load();
    await this.enter(new Creature('Nemnes', {x: 100, y: 100}, {x: 0, y: 0}));
  }
}
</script>
