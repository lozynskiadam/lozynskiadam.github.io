<template>
  <button class="bookmark-inventory" @click="visible = !visible" :class="{'active': visible}">
    <img src="../assets/images/inventory.png" alt="Inv"/>
  </button>
  <div v-if="visible" id="inventory">
    <div class="inventory-header">
      Inventory
    </div>
    <div class="inventory-container">
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
      visible: false,
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
    window.addEventListener("inventory-toggle", () => {
      this.visible = !this.visible;
    });
  }
}
</script>
