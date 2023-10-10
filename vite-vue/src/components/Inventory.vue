<style>
@import "Inventory.scss";
</style>

<template>
  <button class="bookmark-inventory" @click="visible = !visible" :class="{'active': visible}">
    <img src="../assets/images/inventory.png" alt="Inv"/>
  </button>
  <div id="inventory" :style="{'display': visible ? 'block' : 'none'}">
    <div class="header">Inventory</div>
    <div class="container">
      <Slot v-for="i in 80" ref="slot" :index="i - 1"></Slot>
    </div>
  </div>
</template>

<script>
import Slot from "./Slot.vue";
import {globals} from "../utils/globals.js";
import SoundEffect from "../libs/SoundEffect.js";

export default {
  name: 'Inventory',
  components: {Slot},
  data() {
    return {
      visible: false,
      audio: {
        open: null,
        close: null,
      }
    }
  },
  methods: {
    getSlot(slot) {
      return this.$refs.slot[slot];
    },
    getSlots() {
      return this.$refs.slot;
    }
  },
  mounted() {
    globals().setInventory(this);
    window.addEventListener("update-inventory-slot", (event) => {
      if (event.detail.itemId) {
        this.getSlot(event.detail.slot).set(event.detail.itemId, event.detail.quantity);
      } else {
        this.getSlot(event.detail.slot).clear();
      }
    });
    window.addEventListener("inventory-toggle", () => {
      this.visible = !this.visible;
      if (this.visible) {
        SoundEffect.play('inventoryOpen');
      } else {
        SoundEffect.play('inventoryClose');
      }
    });
  }
}
</script>
