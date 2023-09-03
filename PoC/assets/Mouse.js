class Mouse {

    static x = null;
    static y = null;

    static init() {
        document.addEventListener('mousemove', (e) => {
            Mouse.x = e.clientX;
            Mouse.y = e.clientY;
        });
        document.addEventListener('mousedown', () => {
            const mousePos = Mouse.getPosition();
            const serverPos = board.positionLocalToServer(mousePos.x, mousePos.y);
            Effect.get('energy').run(serverPos.x, serverPos.y);
        });
    }

    static getPosition() {
        const canvas = document.querySelector('#board');
        const rect = canvas.getBoundingClientRect();
        const position = {};

        position.x = (Mouse.x - rect.left) / (rect.right - rect.left) * canvas.width;
        position.x = position.x + hero.offset.x;
        position.x = position.x / TILE_SIZE;
        position.x = Math.floor(position.x);

        position.y = (Mouse.y - rect.top) / (rect.bottom - rect.top) * canvas.height;
        position.y = position.y + hero.offset.y;
        position.y = position.y / TILE_SIZE;
        position.y = Math.floor(position.y);

        return position;
    }
}
