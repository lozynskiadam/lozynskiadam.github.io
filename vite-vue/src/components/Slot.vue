<style>
@import "Slot.scss";
</style>

<template>
  <div class="slot" :data-slot-index="index">
    <div v-if="quantity" class="quantity">{{ quantity }}</div>
  </div>
</template>

<script>
import ItemStructure from "../libs/ItemStructure.js";

export default {
  name: 'Slot',
  props: {
    index: Number,
  },
  data() {
    return {
      item: null,
      quantity: null,
    }
  },
  methods: {
    set(itemId, quantity) {
      this.item = ItemStructure.get(itemId);
      this.quantity = quantity;
      this.$el.querySelector('canvas')?.remove();
      this.sprite = this.item.sprite.clone();
      this.sprite.getFrame();
      this.$el.appendChild(this.sprite.canvas);
    },
    clear() {
      this.item = null;
      this.quantity = null;
      this.$el.querySelector('canvas')?.remove();
    },
  }
}
</script>
