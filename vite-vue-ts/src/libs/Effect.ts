import Sprite from "./Sprite.js";
import {EFFECTS_PATH} from "../config.js";
import {EffectDto} from "../interfaces/EffectDto.ts";
import {Position} from "../interfaces/Position.ts";

export default class Effect {

    static #instances: { [p: number]: Effect } = {};
    static #running: { [p: string]: { [p: number]: Sprite } } = {};
    static #lastUID: number = 0;

    id: number;
    sprite: Sprite;

    static async load() {
        try {
            const response = await fetch(EFFECTS_PATH);
            const json: EffectDto[] = await response.json();
            return new Promise<void>((resolve) => {
                Object.values(json).forEach((data) => {
                    new Effect(data.id, Sprite.get(data.sprite));
                });
                window.addEventListener("run-effect", (event: any) => {
                    Effect.get(event.detail.effect).run(event.detail.position, event.detail.onCreature ?? false);
                });
                resolve();
            });
        } catch (error) {
            console.error("Error loading effects:", error);
        }
    }

    constructor(id: number, sprite: Sprite) {
        Effect.#instances[id] = this;

        this.id = id;
        this.sprite = sprite;
    }

    static get(id: number): Effect {
        const effect: Effect = Effect.#instances[id];
        if (!effect) throw `Could not load effect for item ${id}.`;

        return effect;
    }

    static getRunning(position: Position) {
        const positionString = JSON.stringify(position);

        return Object.values(Effect.#running[positionString] ?? {});
    }

    run(position: Position, onCreature: boolean = false) {
        const positionString = JSON.stringify(position);
        const uid = ++Effect.#lastUID;
        const sprite = this.sprite.clone();

        if (!Effect.#running[positionString]) {
            Effect.#running[positionString] = {};
        }

        sprite.customData = {onCreature: onCreature};
        Effect.#running[positionString][uid] = sprite;
        sprite.play().then(() => {
            delete Effect.#running[positionString][uid];
            if (Object.keys(Effect.#running[positionString]).length === 0) {
                delete Effect.#running[positionString];
            }
        });
    }
}
