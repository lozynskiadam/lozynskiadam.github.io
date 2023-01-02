class Sprite {

  canvas = null;
  ctx = null;
  image = null;
  columns = null;
  frames = null;
  currentColumn = 0;
  currentFrame = 0;
  animateFirstFrame = null;
  interval = null;

  constructor(image, width = 38, height = 38, animateFirstFrame = true) {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.image = image;
    this.canvas.width = width;
    this.canvas.height = height;
    this.columns = image.width / this.canvas.width;
    this.frames = image.height / this.canvas.height;
    this.animateFirstFrame = animateFirstFrame;
  }

  play(time = 1000, continuous = false) {
    if (this.interval) {
      return;
    }
    const firstFrame = this.animateFirstFrame ? 0 : 1;
    this.interval = setInterval(() => {
      if (++this.currentFrame >= this.frames) {
        continuous ? this.currentFrame = firstFrame : this.stop();
      }
    }, time / (this.frames - firstFrame));
  }

  stop() {
    clearInterval(this.interval);
    this.interval = null;
    this.currentFrame = 0;
  }

  getImage() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.image, this.currentColumn * -this.canvas.width, this.currentFrame * -this.canvas.height);

    return this.canvas;
  }

  static createImage(src) {
    return new Promise(resolve => {
      let img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
  };
}
