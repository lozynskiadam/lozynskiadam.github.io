class Sprite {

    #image = null;
    #speed = null;
    #states = [];
    #canvas = null;
    #ctx = null;
    #interval = null;
    #currentState = null;
    #currentFrame = null;

    constructor(data) {
        this.#image = data.image;
        this.#speed = data.speed;
        this.#states = data.states || [];
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
        if (numberOfFrames > 1) {
            this.#interval = setInterval(() => {
                if (++this.#currentFrame > numberOfFrames) {
                    this.#currentFrame = 1;
                }
            }, this.#speed);
        }
    }

    get() {
        const frame = this.#states[this.#currentState][this.#currentFrame - 1]

        this.#canvas.width = frame.w;
        this.#canvas.height = frame.h;

        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        this.#ctx.drawImage(this.#image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);

        return this.#canvas;
    }
}
