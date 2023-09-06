class Mouse {

    static x = null;
    static y = null;

    static init() {
        document.addEventListener('mousemove', (e) => {
            Mouse.x = e.clientX;
            Mouse.y = e.clientY;

            const position = Mouse.getServerPosition();
            Board.getTileStack(position.x, position.y).forEach((itemId) => {
                if (itemId === 8) {
                    Board.ctx.canvas.setAttribute('cursor', 'pointer');
                } else {
                    Board.ctx.canvas.removeAttribute('cursor');
                }
            });
        });

        var isClickBlocked = false
        document.addEventListener('mousedown', () => {
            if (isClickBlocked) {
                return;
            }
            const position = Mouse.getServerPosition();
            Board.getTileStack(position.x, position.y).forEach((itemId) => {
                if (itemId === 8) {
                    isClickBlocked = true;
                    Effect.get('ore-hit').run(position.x, position.y);
                    setTimeout(() => {
                        isClickBlocked = false;
                    }, 600);
                }
            });
        });
    }

    static getLocalPosition() {
        const rect = Board.ctx.canvas.getBoundingClientRect();
        const position = {};

        position.x = (Mouse.x - rect.left) / (rect.right - rect.left) * Board.ctx.canvas.width;
        position.x = position.x + hero.offset.x;
        position.x = position.x / TILE_SIZE;
        position.x = Math.floor(position.x);

        position.y = (Mouse.y - rect.top) / (rect.bottom - rect.top) * Board.ctx.canvas.height;
        position.y = position.y + hero.offset.y;
        position.y = position.y / TILE_SIZE;
        position.y = Math.floor(position.y);

        return position;
    }

    static getServerPosition() {
        const position = Mouse.getLocalPosition();

        return Board.positionLocalToServer(position.x, position.y);
    }
}
