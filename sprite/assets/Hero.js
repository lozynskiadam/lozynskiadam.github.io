class Hero {

    #direction = null;
    #sprite = null;
    #isWalking = false;

    constructor() {
        let image = new Image();
        image.onload = () => {
            this.#sprite = new Sprite(image, 32, 48);
            this.#sprite.play(750, true);
            this.setDirection('south');
        };
        image.src = 'assets/charset.png';
    }

    setDirection(direction) {
        this.#direction = direction;
        this.#isWalking ? this.walk() : this.stay();
    }

    stay() {
        this.#isWalking = false;
        this.#sprite.stop();
        this.#sprite.play(750, true);
        this.#sprite.setRow(1);
        this.#sprite.setColumn({
            south: 1,
            west: 2,
            north: 3,
            east: 4,
        }[this.#direction] ?? 1);
    }

    walk() {
        this.#isWalking = true;
        this.#sprite.stop();
        this.#sprite.play(750, true);
        this.#sprite.setRow(1);
        this.#sprite.setColumn({
            south: 5,
            west: 6,
            north: 7,
            east: 8,
        }[this.#direction] ?? 5);
    }

    getImage() {
        return this.#sprite?.getCurrentFrame();
    }

}
