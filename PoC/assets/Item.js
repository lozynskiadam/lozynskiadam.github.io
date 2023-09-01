class Item {

    static #instances = {};

    id = null;
    name = null;
    sprite = null;
    type = null;
    isBlockingCreatures = null;

    static async load(url) {
        try {
            const response = await fetch(url);
            const json = await response.json();
            return new Promise((resolve) => {
                Object.values(json).forEach((data) => {
                    new Item(data.id, data)
                });
                resolve();
            });
        } catch (error) {
            console.error("Error loading sprites:", error);
        }
    }

    static get(id) {
        return Item.#instances[id] ?? null;
    }

    constructor(id, data) {
        Item.#instances[id] = this;

        this.id = data.id;
        this.name = data.name;
        this.sprite = data.sprite;
        this.type = data.type;
        this.isBlockingCreatures = data.isBlockingCreatures;
    }
}
