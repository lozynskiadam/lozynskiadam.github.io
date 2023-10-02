<style>
@import "Vitality.scss";
</style>

<template>
  <div id="vitality">
    <div class="health-bar">{{ health }}/{{ maxHealth }}</div>
    <div class="mana-bar">{{ mana }}/{{ maxMana }}</div>
    <div>
      <span v-for="state in states">{{ state }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Vitality',
  data() {
    return {
      health: 0,
      maxHealth: 0,
      mana: 0,
      maxMana: 0,
      states: []
    }
  },
  mounted() {
    window.addEventListener("update-vitals", (event) => {
      if (typeof event.detail.health !== 'undefined') this.health = event.detail.health;
      if (typeof event.detail.mana !== 'undefined') this.mana = event.detail.mana;
      if (typeof event.detail.maxHealth !== 'undefined') this.maxHealth = event.detail.maxHealth;
      if (typeof event.detail.maxMana !== 'undefined') this.maxMana = event.detail.maxMana;
      if (typeof event.detail.states !== 'undefined') this.states = event.detail.states;
    });
  }
}
</script>
