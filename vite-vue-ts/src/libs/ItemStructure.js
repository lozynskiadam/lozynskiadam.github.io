import Sprite from "./Sprite.js";
import {ITEMS_PATH} from "../config.js";

export default class ItemStructure {

    static #instances = {};

    id;
    name;
    type;
    altitude;
    sprite;
    isUsable;
    isMovable;
    isPickupable;
    isBlockingCreatures;
    isBlockingItems;

    static async load() {
        try {
            const response = await fetch(ITEMS_PATH);
            const json = await response.json();
            return new Promise((resolve) => {
                Object.values(json).forEach((data) => new ItemStructure(data.id, data));
                resolve();
            });
        } catch (error) {
            console.error("Error loading items:", error);
        }
    }

    static get(id) {
        const structure = ItemStructure.#instances[id];
        if (!structure) throw `Could not load structure for item ${id}.`;

        return structure;
    }

    constructor(id, data) {
        ItemStructure.#instances[id] = this;

        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.altitude = data.altitude;
        this.isUsable = data.isUsable;
        this.isMovable = data.isMovable;
        this.isPickupable = data.isPickupable;
        this.isBlockingCreatures = data.isBlockingCreatures;
        this.isBlockingItems = data.isBlockingItems;

        this.sprite = Sprite.get(data.sprite);
        this.sprite.loop();
    }
}
