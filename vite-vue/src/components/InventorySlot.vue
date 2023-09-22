<template>
  <div class="slot" :data-slot-index="index"></div>
</template>

<script>
import Item from "../libs/Item.js";

export default {
  name: 'InventorySlot',
  props: {
    index: Number,
    item: Item
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

<style>
#app[cursor="crosshair"] {
  .slot:hover {
    border: 2px solid #ffffff;
  }
}

.slot {
  width: 50px;
  height: 50px;
  background: #555;
  border: 2px solid #222;
  margin: 2px;

  canvas {
    width: 100%;
    pointer-events: none;
  }
}
</style>