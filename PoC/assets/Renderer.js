class Renderer {

    static renderTile(x, y, sx, sy, layer, tile) {
        if (layer === 'ground') {
            tile.forEach((itemId) => {
                if (Item.get(itemId).type === 'ground') {
                    Renderer.drawSprite(Item.get(itemId).sprite.getFrame(), x, y);
                }
            });
        }

        if (layer === 'objects') {
            if (Mouse.position.x === x && Mouse.position.y === y) {
                Renderer.drawSprite(Sprite.get('cursor').getFrame(), x, y)
            }

            tile.forEach((itemId) => {
                const item = Item.get(itemId);
                if (item.type === 'object') {
                    Renderer.drawSprite(item.sprite.getFrame(), x, y)
                }
            });

            if (sx === Hero.position.x && sy === Hero.position.y) {
                Renderer.drawCreature({sprite: Hero.sprite, offset: Hero.offset}, x, y)
            }

            Board.getEffects(sx, sy).forEach((effect) => {
                Renderer.drawSprite(effect.getFrame(), x, y)
            });
        }
    }

    static drawSprite(image, x, y) {
        let top = (y * TILE_SIZE) + (TILE_SIZE - image.height);
        let left = (x * TILE_SIZE) + (Math.ceil(TILE_SIZE / 2) - Math.ceil(image.width / 2));
        Renderer.tempCtx.drawImage(image, left, top);
    }

    static drawCreature(creature, x, y) {
        let image = creature.sprite.getFrame();
        let top = (y * TILE_SIZE) + (TILE_SIZE - image.height) + creature.offset.y;
        let left = (x * TILE_SIZE) + (Math.ceil(TILE_SIZE / 2) - Math.ceil(image.width / 2)) + creature.offset.x;
        Renderer.tempCtx.drawImage(image, left, top);
    }

    static cropEdges(ctx) {
        ctx.clearRect(0, 0, TILE_SIZE, ctx.canvas.height);
        ctx.clearRect(0, 0, ctx.canvas.width, TILE_SIZE);
        ctx.clearRect(ctx.canvas.width - TILE_SIZE, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.clearRect(0, ctx.canvas.height - TILE_SIZE, ctx.canvas.width, ctx.canvas.height);
    }

    static render() {
        const canvas = document.createElement('canvas');
        canvas.width = Board.ctx.canvas.width;
        canvas.height = Board.ctx.canvas.height;
        Renderer.tempCtx = canvas.getContext('2d');
        Renderer.tempCtx.fillStyle = '#25131a';
        Renderer.tempCtx.fillRect(0, 0, Renderer.tempCtx.canvas.width, Renderer.tempCtx.canvas.height);
        for (let layer of ['ground', 'objects']) {
            let y = 0;
            for (let [sy, row] of Object.entries(Board.tiles)) {
                let x = 0;
                for (let [sx, tile] of Object.entries(row)) {
                    Renderer.renderTile(x, y, Number(sx), Number(sy), layer, tile);
                    x++;
                }
                y++;
            }
        }
        Board.ctx.clearRect(0, 0, Board.ctx.canvas.width, Board.ctx.canvas.height);
        Board.ctx.drawImage(canvas, -Hero.offset.x, -Hero.offset.y);
        Renderer.cropEdges(Board.ctx);

        window.requestAnimationFrame(Renderer.render);
    }

}
