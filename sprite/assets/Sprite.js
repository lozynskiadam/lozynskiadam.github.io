class Sprite {

  #image = null;
  #column = 1;
  #columns = null;
  #row = 1;
  #rows = null;
  #canvas = null;
  #ctx = null;
  #interval = null;

  constructor(image, width, height) {
    this.#image = image;
    this.#canvas = document.createElement("canvas");
    this.#ctx = this.#canvas.getContext("2d");
    this.#canvas.width = width;
    this.#canvas.height = height;
    this.#columns = image.width / this.#canvas.width;
    this.#rows = image.height / this.#canvas.height;
  }

  setColumn(column) {
    this.#column = column;
  }

  setRow(row) {
    this.#row = row;
  }

  play(time = 1000, continuous = false) {
    if (this.#interval) {
      return;
    }
    this.#interval = setInterval(() => {
      if (++this.#row > this.#rows) {
        if (continuous) {
          this.#row = 1
        } else {
          this.stop()
        }
      }
    }, time / (this.#rows - 1));
  }

  stop() {
    clearInterval(this.#interval);
    this.#interval = null;
  }

  getCurrentFrame() {
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#ctx.drawImage(this.#image, (this.#column - 1) * -this.#canvas.width, (this.#row - 1) * -this.#canvas.height);

    return this.#canvas;
  }

  getFrame(column, row) {
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#ctx.drawImage(this.#image, (column - 1) * -this.#canvas.width, (row - 1) * -this.#canvas.height);

    return this.#canvas;
  }
}
