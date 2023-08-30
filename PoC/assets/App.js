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
window.Sprites = {};
fetch('assets/sprites.json').then((response) => response.json()).then((json) => {
    let loadedSprites = 0;

    function loaded() {
        loadedSprites++;
        if (loadedSprites === Object.entries(json).length) {
            window.dispatchEvent(new CustomEvent("sprites-loaded"));
        }
    }

    for (const [key, data] of Object.entries(json)) {
        const image = new Image();
        image.onload = () => {
            if (data.mask) {
                const mask = new Image();
                mask.onload = () => {
                    Sprites[key] = new Sprite({
                        image: image,
                        mask: mask,
                        speed: data.speed || null,
                        states: data.states || null
                    });
                    loaded();
                };
                mask.src = data.mask;
            } else {
                Sprites[key] = new Sprite({
                    image: image,
                    speed: data.speed || null,
                    states: data.states || null
                });
                loaded();
            }
        };
        image.src = data.base;
    }
});

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
    window.hero = new Hero(Sprites['outfit']);
    window.board = new Board(BOARD_WIDTH, BOARD_HEIGHT);
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
