class Sprite {

    static #instances = {};

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
        return new Promise((resolve) => {
            fetch(url).then((response) => response.json()).then((json) => {

                let loadedSprites = 0;
                function loaded() {
                    if (++loadedSprites === Object.entries(json).length) {
                        window.dispatchEvent(new CustomEvent("sprites-loaded"));
                        resolve();
                    }
                }

                for (const [id, data] of Object.entries(json)) {
                    const image = new Image();
                    image.onload = () => {
                        let spriteOptions = {
                            image: image,
                            speed: data.speed || null,
                            states: data.states || null
                        }

                        if (data.mask) {
                            const mask = new Image();
                            mask.onload = () => {
                                spriteOptions.mask = mask;
                                new Sprite(id, spriteOptions);
                                loaded();
                            };
                            mask.src = data.mask;
                        } else {
                            new Sprite(id, spriteOptions);
                            loaded();
                        }
                    };
                    image.src = data.base;
                }
            });
        });
    }

    static get(key) {
        return Sprite.#instances[key];
    }

    constructor(key, data) {
        Sprite.#instances[key] = this;

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
