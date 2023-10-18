<style>
@import "Inventory.scss";
</style>

<template>
  <button class="bookmark-inventory" @click="this.toggle()" :class="{'active': visible}">
    <img src="../assets/images/bookmark-inventory.png" alt="Inv"/>
  </button>
  <div id="inventory" :style="{'display': visible ? 'block' : 'none'}">
    <div class="header">
      <div class="header-icon"></div>
      <span class="header-title">Inventory</span>
      <button @click="toggle()" class="button-close">✕</button>
    </div>
    <div class="container">
      <Slot v-for="i in 80" ref="slot" :index="i - 1"></Slot>
    </div>
  </div>
</template>

<script>
import Slot from "./Slot.vue";
import {globals} from "../utils/globals.js";
import SoundEffect from "../libs/SoundEffect.js";
import Item from "../libs/Item.js";

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
    },
    getFirstSlotWithItem(itemId) {
      for (const [slotId, value] of Object.entries(this.getSlots())) {
        if (value.item ? value.item.id === itemId : null === itemId) {
          return slotId;
        }
      }
      return null;
    },
    toggle() {
      this.visible = !this.visible;
      if (this.visible) {
        SoundEffect.play('inventoryOpen');
      } else {
        SoundEffect.play('inventoryClose');
      }
    },
  },
  mounted() {
    globals().setInventory(this);
    window.addEventListener("update-inventory-slot", (event) => {
      if (event.detail.itemId && event.detail.quantity > 0) {
        this.getSlot(event.detail.slot).set(new Item(event.detail.itemId, event.detail.quantity));
      } else {
        this.getSlot(event.detail.slot).clear();
      }
    });
    window.addEventListener("inventory-toggle", this.toggle);
  }
}
</script>
