import Sprite from "./Sprite.js";
import {ITEMS_PATH} from "../config.js";
import {ItemStructureDto} from "../interfaces/ItemStructureDto.ts";

export default class ItemStructure {

    static #instances: {[p: number]: ItemStructure} = {};

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
            const json: ItemStructureDto[] = await response.json();
            return new Promise<void>((resolve) => {
                Object.values(json).forEach((data) => new ItemStructure(data.id, data));
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

    constructor(id: number, data: ItemStructureDto) {
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
