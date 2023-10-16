import Sprite from "./Sprite.js";
import {ITEMS_PATH} from "../config.js";

export default class ItemStructure {

    static #instances = {};

    id = null;
    name = null;
    type = null;
    altitude = null;
    sprite = null;
    isUsable = null;
    isMovable = null;
    isPickupable = null;
    isBlockingCreatures = null;
    isBlockingItems = null;

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
        return ItemStructure.#instances[id] ?? null;
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
