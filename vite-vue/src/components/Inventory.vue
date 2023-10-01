<template>
  <button class="bookmark-inventory" @click="visible = !visible" :class="{'active': visible}">
    <img src="../assets/images/inventory.png" alt="Inv"/>
  </button>
  <div v-if="visible" id="inventory">
    <div class="inventory-header">
      Inventory
    </div>
    <div class="inventory-container">
      <template v-for="(slot, index) in slots" :key="slot?.item">
        <InventorySlot :item="slot?.item" :quantity="slot?.quantity" :index="index"></InventorySlot>
      </template>
    </div>
  </div>
</template>

<script>
import InventorySlot from "./InventorySlot.vue";
import Item from "../libs/Item.js";

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
    update(slot, itemId, quantity) {
      this.slots[slot] = {
        item: Item.get(itemId),
        quantity: quantity,
      };
    }
  },
  mounted() {
    window.addEventListener("update-inventory-slot", (event) => {
      this.update(event.detail.slot, event.detail.itemId, event.detail.quantity);
    });
    window.addEventListener("inventory-toggle", () => {
      this.visible = !this.visible;
    });
  }
}
</script>
