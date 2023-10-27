<style>
@import "Equipment.scss";
</style>

<template>
  <button class="bookmark-equipment" @click="this.toggle()" :class="{'active': visible}">
    <img src="../assets/images/equipment.png" alt="Eq"/>
  </button>
  <div id="equipment" :style="{'display': visible ? 'block' : 'none'}">
    <div class="header">
      <div class="header-icon"></div>
      <span class="header-title">Equipment</span>
      <button @click="toggle()" class="button-close">✕</button>
    </div>
    <div class="container">
      <div class="slots">
        <Slot ref="slot" id="helmet" index=100></Slot>
        <Slot ref="slot" id="armor" index=101></Slot>
        <Slot ref="slot" id="belt" index=102></Slot>
        <Slot ref="slot" id="boots" index=103></Slot>
        <Slot ref="slot" id="amulet" index=104></Slot>
        <Slot ref="slot" id="cape" index=105></Slot>
        <Slot ref="slot" id="weapon" index=106></Slot>
        <Slot ref="slot" id="shield" index=107></Slot>
        <Slot ref="slot" id="glove" index=108></Slot>
        <Slot ref="slot" id="ring" index=109></Slot>
      </div>
    </div>
  </div>
</template>

<script>
import Slot from "./Slot.vue";
import {globals} from "../utils/globals.js";
import SoundEffect from "../libs/SoundEffect.js";

export default {
  name: 'Equipment',
  components: {Slot},
  data() {
    return {
      visible: false
    }
  },
  methods: {
    getSlot(slot) {
      return this.$refs.slot[slot];
    },
    getSlots() {
      return this.$refs.slot;
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
    globals().setEquipment(this);
    window.addEventListener("equipment-toggle", this.toggle);
  }
}
</script>
