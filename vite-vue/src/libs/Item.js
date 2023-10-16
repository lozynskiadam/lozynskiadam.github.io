import ItemStructure from "./ItemStructure.js";

export default class Item {

    id = null;
    quantity = null;

    constructor(id, quantity = 1) {
        this.id = id;
        this.quantity = quantity;
    }

    getStructure() {
        return ItemStructure.get(this.id);
    }

}
