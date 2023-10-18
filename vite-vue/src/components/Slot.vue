<style>
@import "Slot.scss";
</style>

<template>
  <div class="slot" :data-slot-index="index" @click="use()">
    <div v-if="item" class="quantity">{{ item.quantity }}</div>
  </div>
</template>

<script>
import WebsocketRequest from "../libs/WebsocketRequest.js";

export default {
  name: 'Slot',
  props: {
    index: Number,
  },
  data() {
    return {
      item: null,
      sprite: null,
    }
  },
  methods: {
    use() {
      if (!this.item) return;
      if (!this.item.isUsable()) return;
      WebsocketRequest.use(this.item.id, null, this.index);
    },
    set(item) {
      this.item = item;
      this.$el.querySelector('canvas')?.remove();
      const sprite = this.item.getSprite().clone();
      sprite.getFrame();
      this.$el.appendChild(sprite.canvas);
    },
    clear() {
      this.item = null;
      this.$el.querySelector('canvas')?.remove();
    },
  }
}
</script>
