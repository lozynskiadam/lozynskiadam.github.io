class Mouse {

    static x = null;
    static y = null;

    static init() {
        document.addEventListener('mousemove', (e) => {
            Mouse.x = e.clientX;
            Mouse.y = e.clientY;
        });
        document.addEventListener('mousedown', () => {
            const position = Mouse.getServerPosition();
            Effect.get('energy').run(position.x, position.y);
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
