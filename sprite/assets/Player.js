class Player {

  x = null;
  y = null;
  direction = null;

  sprite = null;
  speed = 10;

  constructor() {
    Sprite.createImage('assets/outfit.png').then((image) => {
      this.sprite = new Sprite(image, 38, 38, false);
    });
  }

  rotate(direction) {
    this.direction = direction;

    this.sprite.currentColumn = {
      north: 0,
      south: 1,
    }[this.direction] ?? 0;
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }

  getStepTime() {
    return 600 - (this.speed * 5.5) + 35;
  }

}
