import Sprite from "./Sprite.js";
import {ITEMS_PATH} from "../config.js";
import {ItemStructureConfig} from "../interfaces/ItemStructureConfig.ts";

export default class ItemStructure {

    static #instances: { [p: number]: ItemStructure } = {};

    id: number;
    name: string;
    type: string;
    altitude: number;
    sprite: Sprite;
    isUsable: boolean;
    isMovable: boolean;
    isPickupable: boolean;
    isBlockingCreatures: boolean;
    isBlockingItems: boolean;

    static async load() {
        try {
            const response = await fetch(ITEMS_PATH);
            const json: ItemStructureConfig[] = await response.json();
            return new Promise<void>((resolve) => {
                Object.values(json).forEach((config) => new ItemStructure(config));
                resolve();
            });
        } catch (error) {
            console.error("Error loading items:", error);
        }
    }

    static get(id: number): ItemStructure {
        const structure: ItemStructure = ItemStructure.#instances[id];
        if (!structure) throw `Could not load structure for item ${id}.`;

        return structure;
    }

    constructor(config: ItemStructureConfig) {
        ItemStructure.#instances[config.id] = this;

        this.id = config.id;
        this.name = config.name;
        this.type = config.type;
        this.altitude = config.altitude;
        this.isUsable = config.isUsable;
        this.isMovable = config.isMovable;
        this.isPickupable = config.isPickupable;
        this.isBlockingCreatures = config.isBlockingCreatures;
        this.isBlockingItems = config.isBlockingItems;

        this.sprite = Sprite.get(config.sprite);
        this.sprite.loop();
    }
}
