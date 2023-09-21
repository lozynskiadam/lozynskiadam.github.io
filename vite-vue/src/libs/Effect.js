import Sprite from "./Sprite.js";
import {$board} from "../utils/globals.js";

export default class Effect {

    static #instances = {};
    static #lastUID = 0;

    #id = null;
    #sprite = null;

    static async load(url) {
        try {
            const response = await fetch(url);
            const json = await response.json();
            return new Promise((resolve) => {
                Object.values(json).forEach((data) => {
                    new Effect(data.id, Sprite.get(data.sprite));
                });
                resolve();
            });
        } catch (error) {
            console.error("Error loading effects:", error);
        }
    }

    constructor(id, sprite) {
        Effect.#instances[id] = this;

        this.#id = id;
        this.#sprite = sprite;
    }

    static get(id) {
        return Effect.#instances[id] ?? null;
    }

    run(position) {
        if (!$board.effects[position.y]) {
            $board.effects[position.y] = {};
        }
        if (!$board.effects[position.y][position.x]) {
            $board.effects[position.y][position.x] = {};
        }

        const uuid = ++Effect.#lastUID;
        const sprite = this.#sprite.clone();
        $board.effects[position.y][position.x][uuid] = sprite;
        sprite.play().then(() => {
            delete $board.effects[position.y][position.x][uuid];
        });
    }
}
