<template>
  <div class="slot" :data-slot-index="index">
    <div class="quantity">{{ quantity }}</div>
  </div>
</template>

<script>
import Item from "../libs/Item.js";

export default {
  name: 'InventorySlot',
  props: {
    index: Number,
    item: Item,
    quantity: Number
  },
  data() {
    return {
      sprite: null
    }
  },
  mounted() {
    if (this.item) {
      this.sprite = this.item.sprite.clone();
      this.sprite.getFrame();
      this.$el.appendChild(this.sprite.canvas);
    }
  }
}
</script>
