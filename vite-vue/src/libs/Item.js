import ItemStructure from "./ItemStructure.js";

export default class Item {

    id = null;
    quantity = null;

    constructor(id, quantity = 1) {
        this.id = id;
        this.quantity = quantity;
    }

    getName() {
        return ItemStructure.get(this.id).name;
    }

    getType() {
        return ItemStructure.get(this.id).type;
    }

    getAltitude() {
        return ItemStructure.get(this.id).altitude;
    }

    getSprite() {
        return ItemStructure.get(this.id).sprite;
    }

    isUsable() {
        return ItemStructure.get(this.id).isUsable;
    }

    isMovable() {
        return ItemStructure.get(this.id).isMovable;
    }

    isPickupable() {
        return ItemStructure.get(this.id).isPickupable;
    }

    isBlockingCreatures() {
        return ItemStructure.get(this.id).isBlockingCreatures;
    }

    isBlockingItems() {
        return ItemStructure.get(this.id).isBlockingItems;
    }

}
