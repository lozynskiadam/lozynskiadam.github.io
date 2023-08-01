class ImageExt {

    static registerCreate() {
        Image.create = function (src) {
            return new Promise(resolve => {
                let img = new Image();
                img.onload = () => resolve(img);
                img.src = src;
            });
        }
    }

    static registerPrototypeDye() {
        Image.prototype.dye = function (colors) {
            if (!this.mask ?? false) {
                return this;
            }

            const hexToRGB = function (hex) {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

                return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
            };
            const replacePixels = function (image, colorMap) {
                Object.keys(colorMap).forEach(key => {
                    colorMap[hexToRGB(key).toString()] = hexToRGB(colorMap[key])
                    delete colorMap[key];
                });
                const ctx = document.createElement("canvas").getContext("2d");
                ctx.canvas.width = image.width;
                ctx.canvas.height = image.height;
                ctx.drawImage(image, 0, 0);
                const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    let currentColor = [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]].toString();
                    if (currentColor in colorMap) {
                        let color = colorMap[currentColor];
                        imageData.data[i] = color[0];
                        imageData.data[i + 1] = color[1];
                        imageData.data[i + 2] = color[2];
                        imageData.data[i + 3] = 255;
                    }
                }
                ctx.putImageData(imageData, 0, 0);

                return ctx.canvas;
            }

            const placeholders = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
            const map = {};
            colors.forEach((color, index) => {
                map[placeholders[index]] = color;
            });

            const coloredMask = replacePixels(this.mask, map);
            const ctx = document.createElement("canvas").getContext("2d");

            ctx.canvas.width = this.width;
            ctx.canvas.height = this.height;
            ctx.drawImage(this, 0, 0);
            ctx.globalCompositeOperation = "overlay";
            ctx.drawImage(coloredMask, 0, 0);

            return ctx.canvas;
        }
    }

}
