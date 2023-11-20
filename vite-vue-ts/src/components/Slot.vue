<style>
@import "Slot.scss";
</style>

<template>
  <div class="slot" :data-slot-id="id" @click="onClick()">
    <div v-if="item" class="quantity">{{ item.quantity }}</div>
  </div>
</template>

<script>
import WebsocketRequest from "../libs/WebsocketRequest.js";

export default {
  name: 'Slot',
  props: {
    id: String,
  },
  data() {
    return {
      item: null,
      sprite: null,
    }
  },
  methods: {
    onClick() {
      if (!this.item) return;
      if (this.item.isUsable()) {
        WebsocketRequest.use(this.item.id, null, this.id);
        return;
      }
      if (this.item.isEquipable()) {
        console.log('Equipping...')
        return;
      }
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
