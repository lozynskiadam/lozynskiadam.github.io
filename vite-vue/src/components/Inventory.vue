<template>
  <div id="inventory">
    <div class="container">
      <template v-for="(item, index) in slots" :key="item">
        <InventorySlot :item="item" :index="index"></InventorySlot>
      </template>
    </div>
  </div>
</template>

<script>
import InventorySlot from "./InventorySlot.vue";

export default {
  name: 'Inventory',
  components: {InventorySlot},
  data() {
    return {
      slots: [null, null, null, null]
    }
  },
  methods: {
    update(slot, item) {
      this.slots[slot] = item;
    }
  },
  mounted() {
    window.addEventListener("update-inventory-item", (event) => {
      this.update(event.detail.slot, event.detail.item);
    });
  }
}
</script>

<style>
#inventory {
  position: absolute;
  width: 204px;
  right: 50px;
  top: 50px;
  background: #000;
  z-index: 5;
  color: #ffffff;

  .container {
    display: grid;
    grid-template-columns: repeat(auto-fill, 50px);
  }
}
</style>