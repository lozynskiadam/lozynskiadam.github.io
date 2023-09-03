class Effect {

    static #instances = {};
    static #board = {};
    static #nextUID = 0;

    #id = null;
    #sprite = null;

    constructor(id, sprite) {
        Effect.#instances[id] = this;

        this.#id = id;
        this.#sprite = sprite;
    }

    static get(id) {
        return Effect.#instances[id] ?? null;
    }

    run(x, y) {
        if (!Effect.#board[y]) {
            Effect.#board[y] = {};
        }
        if (!Effect.#board[y][x]) {
            Effect.#board[y][x] = {};
        }

        const uuid = ++Effect.#nextUID;
        const sprite = this.#sprite.clone();
        Effect.#board[y][x][uuid] = {
            sprite: sprite
        };
        sprite.play().then(() => {
            delete Effect.#board[y][x][uuid];
        });
    }

    static getBoardEffects(x, y) {
        if (Effect.#board && Effect.#board[y] && Effect.#board[y][x]) {
            return this.#board[y][x];
        }

        return [];
    }
}
