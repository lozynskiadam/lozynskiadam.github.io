const TILE_SIZE = 32;
const BOARD_WIDTH = 33;
const BOARD_HEIGHT = 19;

// prepare canvas
const canvas = document.createElement('canvas');
canvas.id = 'board';
canvas.width = TILE_SIZE * BOARD_WIDTH;
canvas.height = TILE_SIZE * BOARD_HEIGHT;
document.querySelector('#app').append(canvas);

// load sprites
Sprite.load('assets/sprites.json');

// load items
window.Items = {};
window.addEventListener("sprites-loaded", () => {
    fetch('assets/items.json').then((response) => response.json()).then((json) => {
        Object.values(json).forEach((item) => {
            Items[item.id] = item;
        });
        window.dispatchEvent(new CustomEvent("items-loaded"));
    });
});


window.addEventListener("items-loaded", () => {
    window.hero = new Hero(Sprite.get('outfit'));
    window.board = new Board(BOARD_WIDTH, BOARD_HEIGHT);
    Renderer.creatures.push(window.hero);

    // add a temporary creature
    Renderer.creatures.push({
        sprite: Sprite.get('outfit'),
        position: {x: 50, y: 50},
        offset: {x: 0, y: 0},
    });

    Renderer.render();

    const triggerKeyHoldingFunctions = () => {
        if (window.keystrokes.checkKey('ArrowUp')) hero.walk('north');
        if (window.keystrokes.checkKey('ArrowDown')) hero.walk('south');
        if (window.keystrokes.checkKey('ArrowLeft')) hero.walk('west');
        if (window.keystrokes.checkKey('ArrowRight')) hero.walk('east');
    }

    document.addEventListener("keydown", () => setTimeout(triggerKeyHoldingFunctions));
    window.keyboardLoop = setInterval(triggerKeyHoldingFunctions, 200);
});
