class Renderer {

    static renderTile(x, y, sx, sy, layer, tile) {
        if (layer === 'ground') {
            tile.forEach((item) => {
                Renderer.drawSprite(Sprites[item].getFrame(), x, y)
            });
        }

        if (layer === 'creatures') {
            if (sx === hero.position.x && sy === hero.position.y) {
                Renderer.drawCreature(hero, x, y)
            }
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

    static render() {
        const mainCtx = document.querySelector('#board').getContext('2d');
        const canvas = document.createElement('canvas');
        canvas.width = mainCtx.canvas.width;
        canvas.height = mainCtx.canvas.height;
        Renderer.tempCtx = canvas.getContext('2d');
        Renderer.tempCtx.fillStyle = '#25131a';
        Renderer.tempCtx.fillRect(0, 0, Renderer.tempCtx.canvas.width, Renderer.tempCtx.canvas.height);
        for (let layer of ['ground', 'creatures']) {
            let y = 0;
            for (let [sy, row] of Object.entries(board.tiles)) {
                let x = 0;
                for (let [sx, tile] of Object.entries(row)) {
                    sx = Number(sx);
                    sy = Number(sy);
                    Renderer.renderTile(x, y, sx, sy, layer, tile);
                    x++;
                }
                y++;
            }
        }
        mainCtx.clearRect(0, 0, mainCtx.canvas.width, mainCtx.canvas.height);
        mainCtx.drawImage(canvas, -hero.offset.x, -hero.offset.y);
        window.requestAnimationFrame(Renderer.render);
    }

}
