import Sprite from "./Sprite.js";
import Board from "./Board.js";

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
        if (!Board.effects[position.y]) {
            Board.effects[position.y] = {};
        }
        if (!Board.effects[position.y][position.x]) {
            Board.effects[position.y][position.x] = {};
        }

        const uuid = ++Effect.#lastUID;
        const sprite = this.#sprite.clone();
        Board.effects[position.y][position.x][uuid] = sprite;
        sprite.play().then(() => {
            delete Board.effects[position.y][position.x][uuid];
        });
    }
}
