export const rand = function (max) {
    return Math.floor(Math.random() * (max + 1));
}

export const roll = function (max) {
    return rand(max) === max;
}

export const randomString = function (length) {
    return window.btoa(String.fromCharCode(...window.crypto.getRandomValues(new Uint8Array(length * 2)))).replace(/[+/]/g, "").substring(0, length);
}

export const randomColor = function () {
    return "#000000".replace(/0/g, function () {
        return (~~(Math.random() * 16)).toString(16);
    });
}

export const hexToRGB = function (hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
};

export const areEqual = function (...objects) {
    return objects.length >= 2 && objects.slice(1).every(obj =>
        Object.keys(objects[0]).length === Object.keys(obj).length &&
        Object.keys(objects[0]).every(key => objects[0][key] === obj[key])
    );
}

export const replaceColors = function (image, colorMap) {
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
        const currentColor = [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]].toString();
        if (currentColor in colorMap) {
            const color = colorMap[currentColor];
            imageData.data[i] = color[0];
            imageData.data[i + 1] = color[1];
            imageData.data[i + 2] = color[2];
            imageData.data[i + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);

    return ctx.canvas;
}

export const loadImage = async function (src) {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.src = src;
    });
}

export const dye = async function (image, mask, colors) {
    return new Promise(resolve => {
        if (!mask ?? false) {
            return image;
        }

        const placeholders = ['#ff0000', '#ff00ff', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
        const map = {};
        colors.forEach((color, index) => {
            map[placeholders[index]] = color;
        });

        const coloredMask = replaceColors(mask, map);
        const ctx = document.createElement("canvas").getContext("2d");

        ctx.canvas.width = image.width;
        ctx.canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        ctx.globalCompositeOperation = "overlay";
        ctx.drawImage(coloredMask, 0, 0);

        const newImage = new Image();
        newImage.onload = () => resolve(newImage);
        newImage.src = ctx.canvas.toDataURL('image/png');
    });
}

export const emit = function (name, properties = {}) {
    window.dispatchEvent(new CustomEvent(name, {detail: properties}));
}
