class Player {

  #direction = null;
  #sprite = null;
  #speed = 10;

  constructor() {
    let image = new Image();
    image.onload = () => {
      this.#sprite = new Sprite(image, 38, 38);
      this.#sprite.play(1000, true);
      this.setDirection('south');
    };
    image.src = 'assets/outfit.png';
  }

  getDirection() {
    return this.#direction;
  }

  setDirection(direction) {
    this.#direction = direction;
    this.#sprite.setColumn({
      south: 1,
      east: 2,
      north: 3,
      west: 4,
    }[direction] ?? 1);
  }

  walk(direction) {
    this.#direction = direction;
    this.#sprite.setRow(1);
    this.#sprite.setColumn({
      south: 5,
      east: 6,
      north: 7,
      west: 8,
    }[direction] ?? 1);
    setTimeout(() => {
      this.setDirection(direction);
    }, this.getStepTime());
  }

  getImage() {
    return this.#sprite?.getCurrentFrame();
  }

  getStepTime() {
    return 600 - (this.#speed * 5.5) + 35;
  }

}
