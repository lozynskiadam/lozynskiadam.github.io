<style>
@import "Inventory.scss";
</style>

<template>
  <button class="bookmark-inventory" @click="visible = !visible" :class="{'active': visible}">
    <img src="../assets/images/inventory.png" alt="Inv"/>
  </button>
  <div id="inventory" :style="{'display': visible ? 'block' : 'none'}">
    <div class="inventory-header">
      Inventory
    </div>
    <div class="inventory-container">
      <Slot v-for="i in 80" ref="slot" :index="i - 1"></Slot>
    </div>
  </div>
</template>

<script>
import Slot from "./Slot.vue";

export default {
  name: 'Inventory',
  components: {Slot},
  data() {
    return {
      visible: false,
    }
  },
  mounted() {
    window.addEventListener("update-inventory-slot", (event) => {
      if (event.detail.itemId) {
        this.$refs.slot[event.detail.slot].set(event.detail.itemId, event.detail.quantity);
      } else {
        this.$refs.slot[event.detail.slot].clear();
      }
    });
    window.addEventListener("inventory-toggle", () => {
      this.visible = !this.visible;
    });
  }
}
</script>
