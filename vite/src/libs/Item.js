import Sprite from "./Sprite.js";

export default class Item {

    static #instances = {};

    id = null;
    name = null;
    type = null;
    altitude = null;
    sprite = null;
    isUsable = null;
    isMovable = null;
    isBlockingCreatures = null;
    isBlockingItems = null;

    static async load(url) {
        try {
            const response = await fetch(url);
            const json = await response.json();
            return new Promise((resolve) => {
                Object.values(json).forEach((data) => new Item(data.id, data));
                resolve();
            });
        } catch (error) {
            console.error("Error loading items:", error);
        }
    }

    static get(id) {
        return Item.#instances[id] ?? null;
    }

    constructor(id, data) {
        Item.#instances[id] = this;

        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.altitude = data.altitude;
        this.isUsable = data.isUsable;
        this.isMovable = data.isMovable;
        this.isBlockingCreatures = data.isBlockingCreatures;
        this.isBlockingItems = data.isBlockingItems;

        this.sprite = Sprite.get(data.sprite);
        this.sprite.loop();
    }
}
