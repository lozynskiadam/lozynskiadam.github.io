class Renderer {

    static render() {
        const ctx = document.querySelector('#board').getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        let y = 0;
        for (let [sy, row] of Object.entries(board.tiles)) {
            let x = 0;
            for (let [sx, tile] of Object.entries(row)) {
                tile.forEach((item) => {
                    ctx.fillStyle = item == '1' ? '#81c06d' : '#515e4e';
                    ctx.fillRect(x * 32, y * 32, 32, 32);
                });
                if (sx == hero.position.x && sy == hero.position.y) {
                    ctx.fillStyle = '#ff0000';
                    ctx.fillRect(x * 32 + 5, y * 32 + 5, 22, 22);
                }
                x++;
            }
            y++;
        }

        window.requestAnimationFrame(Renderer.render);
    }

}
