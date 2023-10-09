<style>
@import "DeadDisplay.scss";
</style>

<template>
  <div v-if="visible" id="dead-display">
    <div class="container">
      <h2 class="title">You are dead</h2>
      <div class="subtitle">Your deeds of valor will be remembered.</div>
      <div class="buttons">
        <button @mouseenter="playAudio('click')" @click="respawn()" :disabled="disabled">Respawn</button>
      </div>
    </div>
  </div>
</template>

<script>
import Movement from "../libs/Movement.js";
import Board from "../libs/Board.js";
import {$hero} from "../utils/globals.js";
import {playAudio} from "../utils/audio.js";

export default {
  name: 'DeadDisplay',
  data() {
    return {
      visible: false,
      disabled: false
    }
  },
  methods: {
    playAudio,
    respawn() {
      playAudio('confirm');
      this.disabled = true;
      setTimeout(() => window.location.href = '', 1000);
    }
  },
  mounted() {
    window.addEventListener("dead", () => {
      this.visible = true;
      Movement.clearPath();
      Movement.isBlocked = true;
      delete Board.creatures[$hero.name];
      playAudio('dead');
    });
  }
}
</script>
