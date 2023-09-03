const TILE_SIZE = 32;
const BOARD_WIDTH = 33;
const BOARD_HEIGHT = 19;

app = async () => {

    async function load() {
        await Sprite.load('assets/sprites.json');
        await Item.load('assets/items.json');
        await Effect.load('assets/effects.json');
    }

    async function init() {
        Keyboard.init();
        Mouse.init();
        window.hero = new Hero(Sprite.get('outfit'));
        Board.init(BOARD_WIDTH, BOARD_HEIGHT);
        Renderer.creatures.push(window.hero);
        Renderer.render();
    }

    await load();
    await init();
}

app();
