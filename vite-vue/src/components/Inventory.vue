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
      slots: [
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
      ]
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
#app[cursor="crosshair"] #inventory {
  cursor: url(../images/cursor-crosshair.png) 11 11, crosshair;
}

#inventory {
  position: absolute;
  right: 50px;
  top: 50px;
  background: #161c23;
  z-index: 5;
  color: #ffffff;
  padding: 12px;
  border: 3px ridge #111518;
  cursor: url(../images/cursor.png), default;
}

#inventory .container {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-column-gap: 4px;
  grid-row-gap: 4px;
}
</style>