const TILE_SIZE = 32;
const BOARD_WIDTH = 33;
const BOARD_HEIGHT = 19;

app = async () => {

    async function load() {
        await Sprite.load('data/sprites.json');
        await Item.load('data/items.json');
        await Effect.load('data/effects.json');
    }

    async function init() {
        Keyboard.init();
        Mouse.init();
        Hero.init();
        Board.init();
        Renderer.render();
    }

    await load();
    await init();
}

app();
