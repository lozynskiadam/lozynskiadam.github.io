const TILE_SIZE = 32;
const BOARD_WIDTH = 33;
const BOARD_HEIGHT = 19;

async function init() {

    const canvas = document.createElement('canvas');
    canvas.id = 'board';
    canvas.width = TILE_SIZE * BOARD_WIDTH;
    canvas.height = TILE_SIZE * BOARD_HEIGHT;
    document.querySelector('#app').append(canvas);

    await Sprite.load('assets/sprites.json');
    await Item.load('assets/items.json');

    window.hero = new Hero(Sprite.get('outfit'));
    window.board = new Board(BOARD_WIDTH, BOARD_HEIGHT);
    Renderer.creatures.push(window.hero);

    Renderer.render();

    const triggerKeyHoldingFunctions = () => {
        if (window.keystrokes.checkKey('ArrowUp')) hero.walk('north');
        if (window.keystrokes.checkKey('ArrowDown')) hero.walk('south');
        if (window.keystrokes.checkKey('ArrowLeft')) hero.walk('west');
        if (window.keystrokes.checkKey('ArrowRight')) hero.walk('east');
    }

    document.addEventListener("keydown", () => setTimeout(triggerKeyHoldingFunctions));
    window.keyboardLoop = setInterval(triggerKeyHoldingFunctions, 200);
}

init();
