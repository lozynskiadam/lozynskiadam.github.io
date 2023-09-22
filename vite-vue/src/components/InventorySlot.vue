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
.slot {
  width: 39px;
  height: 39px;
  background: #111518;
  border: 2px ridge #242732;
  border-radius: 2px;
}

#app[cursor="crosshair"] .slot:hover {
  border: 2px solid #ffffff;
}

.slot canvas {
  width: 100%;
  pointer-events: none;
}
</style>
