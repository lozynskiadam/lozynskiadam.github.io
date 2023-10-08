<style>
@import "DeadDisplay.scss";
</style>

<template>
  <div v-if="visible" id="dead-display">
    <div class="container">
      <h2 class="title">You are dead</h2>
      <div class="subtitle">Your deeds of valor will be remembered.</div>
      <div class="buttons">
        <button @click="respawn()">Respawn</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeadDisplay',
  data() {
    return {
      visible: false,
    }
  },
  methods: {
    respawn() {
      window.location.href = '';
    }
  },
  mounted() {
    window.addEventListener("dead", () => {
      this.visible = true;
    });
  }
}
</script>
