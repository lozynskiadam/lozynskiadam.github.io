
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


window.addEventListener("sprites-loaded", () => {
    window.hero = new Hero(Sprites['outfit']);
    window.board = new Board();
    Renderer.render();
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.code === 'Numpad8') hero.walk('up');
        if (e.key === 'ArrowDown' || e.key === 's' || e.code === 'Numpad2') hero.walk('down');
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.code === 'Numpad4') hero.walk('left');
        if (e.key === 'ArrowRight' || e.key === 'd' || e.code === 'Numpad6') hero.walk('right');
    });
});
