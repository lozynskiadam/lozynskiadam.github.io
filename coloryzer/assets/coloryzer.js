const Coloryzer = {

    baseConfig: {
        base: null,
        mask: null,
        colors: [],
        placeholders: [
            '#ff0000',
            '#00ff00',
            '#0000ff',
            '#ffff00',
            '#00ffff',
            '#ff00ff',
        ]
    },

    make: function (config) {
        return new Promise(async resolve => {
            config = {...Coloryzer.baseConfig, ...config};

            const base = await Coloryzer.createImage(config.base);
            const mask = await Coloryzer.replaceMaskColors(
                await Coloryzer.createImage(config.mask),
                config.placeholders.map(hex => Coloryzer.hexToRGB(hex)),
                config.colors.map(hex => Coloryzer.hexToRGB(hex))
            );

            const ctx = document.createElement("canvas").getContext("2d");
            ctx.canvas.width = base.width;
            ctx.canvas.height = base.height;
            ctx.drawImage(base, 0, 0);
            ctx.globalCompositeOperation = "overlay";
            ctx.drawImage(mask, 0, 0);

            resolve(await Coloryzer.createImage(ctx.canvas.toDataURL()));
        });
    },

    createImage: function (src) {
        return new Promise(resolve => {
            let img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
        });
    },

    replaceMaskColors: function (mask, placeholders, colors) {
        return new Promise(async resolve => {
            const ctx = document.createElement("canvas").getContext("2d");
            ctx.canvas.width = mask.width;
            ctx.canvas.height = mask.height;
            ctx.drawImage(mask, 0, 0);
            const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
                let currentColor = [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]];
                if (currentColor.toString() === [0, 0, 0].toString()) {
                    continue;
                }

                let color = null;
                placeholders.forEach((placeholderColor, index) => {
                    if (currentColor.toString() === placeholderColor.toString()) {
                        color = colors[index] || null;
                    }
                });

                imageData.data[i] = color ? color[0] : 0;
                imageData.data[i + 1] = color ? color[1] : 0;
                imageData.data[i + 2] = color ? color[2] : 0;
                imageData.data[i + 3] = color ? 255 : 0;
            }
            ctx.putImageData(imageData, 0, 0);

            resolve(await Coloryzer.createImage(ctx.canvas.toDataURL()))
        });
    },

    hexToRGB: function (hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
    }

}
