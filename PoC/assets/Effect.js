class Effect {

    static #instances = {};
    static #board = {};
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

    run(sx, sy) {
        if (!Effect.#board[sy]) {
            Effect.#board[sy] = {};
        }
        if (!Effect.#board[sy][sx]) {
            Effect.#board[sy][sx] = {};
        }

        const uuid = ++Effect.#lastUID;
        const sprite = this.#sprite.clone();
        Effect.#board[sy][sx][uuid] = sprite;
        sprite.play().then(() => {
            delete Effect.#board[sy][sx][uuid];
        });
    }

    static getBoardEffects(sx, sy) {
        if (Effect.#board && Effect.#board[sy] && Effect.#board[sy][sx]) {
            return Object.values(this.#board[sy][sx]);
        }

        return [];
    }
}
