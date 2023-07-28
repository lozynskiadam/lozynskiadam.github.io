class ImageUtils {

    static createImage(src) {
        return new Promise(resolve => {
            let img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
        });
    };

    static hexToRGB(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
    };

    static replacePixels(image, colorMap) {
        Object.keys(colorMap).forEach(key => {
            colorMap[ImageUtils.hexToRGB(key).toString()] = ImageUtils.hexToRGB(colorMap[key])
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

    static dye(base, mask, colors) {
        const placeholders = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
        const map = {};
        colors.forEach((color, index) => {
            map[placeholders[index]] = color;
        });

        const overlayImg = ImageUtils.replacePixels(mask, map);
        const ctx = document.createElement("canvas").getContext("2d");

        ctx.canvas.width = base.width;
        ctx.canvas.height = base.height;
        ctx.drawImage(base, 0, 0);
        ctx.globalCompositeOperation = "overlay";
        ctx.drawImage(overlayImg, 0, 0);

        return ctx.canvas;
    };

}
