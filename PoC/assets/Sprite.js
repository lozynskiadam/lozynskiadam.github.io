class Sprite {

    static #instances = {};

    #id = null;
    #image = null;
    #mask = null;
    #colors = null;
    #speed = null;
    #states = null;
    #canvas = null;
    #ctx = null;
    #interval = null;
    #currentState = null;
    #currentFrame = null;
    #lastFrame = null;

    static async load(url) {
        try {
            const response = await fetch(url);
            const json = await response.json();
            await Promise.all(Object.entries(json).map(async ([id, data]) => {
                const image = await Sprite.loadImage(data.base);
                const spriteOptions = {
                    image: image,
                    speed: data.speed || null,
                    states: data.states || null
                };

                if (data.mask) {
                    spriteOptions.mask = await Sprite.loadImage(data.mask);
                }

                new Sprite(id, spriteOptions);
            }));
        } catch (error) {
            console.error("Error loading sprites:", error);
        }
    }

    static async loadImage(src) {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.src = src;
        });
    }

    static get(id) {
        return Sprite.#instances[id] ?? null;
    }

    constructor(id, data) {
        Sprite.#instances[id] = this;

        this.#id = id;
        this.#image = data.image;
        this.#mask = data.mask || null;
        this.#colors = data.colors || null;
        this.#speed = data.speed || null;
        this.#states = data.states || {};
        this.#states.origin = [{x: 0, y: 0, w: this.#image.width, h: this.#image.height}];
        this.#canvas = document.createElement("canvas");
        this.#ctx = this.#canvas.getContext("2d");

        this.state(Object.keys(this.#states)[0]);
    }

    state(state = null) {
        if (state === null) {
            return this.#currentState;
        }

        if (this.#currentState === state) {
            return;
        }

        clearInterval(this.#interval);
        this.#interval = null;
        this.#currentState = state;
        this.#currentFrame = 1;

        const numberOfFrames = this.#states[state].length;
        if (numberOfFrames > 1 && this.#speed) {
            this.#interval = setInterval(() => {
                if (++this.#currentFrame > numberOfFrames) {
                    this.#currentFrame = 1;
                }
            }, this.#speed);
        }
    }

    getFrame() {
        const frame = this.#states[this.#currentState][this.#currentFrame - 1];
        if (this.#lastFrame === frame) {
            return this.#canvas;
        }

        this.#lastFrame = frame;
        this.#canvas.width = frame.w;
        this.#canvas.height = frame.h;

        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        this.#ctx.drawImage(this.#image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);

        return this.#canvas;
    }
}
