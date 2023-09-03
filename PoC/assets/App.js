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
        const canvas = document.createElement('canvas');
        canvas.id = 'board';
        canvas.width = TILE_SIZE * BOARD_WIDTH;
        canvas.height = TILE_SIZE * BOARD_HEIGHT;
        document.querySelector('#app').append(canvas);

        Keyboard.init();
        Mouse.init();

        window.hero = new Hero(Sprite.get('outfit'));
        window.board = new Board(BOARD_WIDTH, BOARD_HEIGHT);
        Renderer.creatures.push(window.hero);

        Renderer.render();
    }

    await load();
    await init();
}

app();
