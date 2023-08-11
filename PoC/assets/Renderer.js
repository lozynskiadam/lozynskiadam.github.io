class Renderer {

    static render() {
        const mainCtx = document.querySelector('#board').getContext('2d');

        const canvas = document.createElement('canvas');
        canvas.width = mainCtx.canvas.width;
        canvas.height = mainCtx.canvas.height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let layer of ['ground', 'creatures']) {
            let y = 0;
            for (let [sy, row] of Object.entries(board.tiles)) {
                let x = 0;
                for (let [sx, tile] of Object.entries(row)) {
                    sx = Number(sx);
                    sy = Number(sy);

                    if (layer === 'ground') {
                        tile.forEach((item) => {
                            ctx.fillStyle = item === '1' ? '#81c06d' : '#515e4e';
                            ctx.fillRect(x * 32, y * 32, 32, 32);
                        });
                    }

                    if (layer === 'creatures') {
                        if (sx === hero.position.x && sy === hero.position.y) {
                            ctx.fillStyle = '#ff0000';
                            ctx.fillRect(
                                x * 32 + 5 + hero.offset.x,
                                y * 32 + 5 + hero.offset.y,
                                22,
                                22
                            );
                        }
                    }
                    x++;
                }
                y++;
            }
        }

        mainCtx.drawImage(canvas, hero.offset.x * (-1), hero.offset.y * (-1));

        window.requestAnimationFrame(Renderer.render);
    }

}
