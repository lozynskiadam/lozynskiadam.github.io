class Board {

    width = null;
    height = null;
    tiles = {};

    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.update();
        window.addEventListener("hero-position-changed", () => {this.update()});
    }

    update() {
        const fromX = hero.position.x - Math.floor(this.width / 2);
        const toX = hero.position.x + Math.floor(this.width / 2);
        const fromY = hero.position.y - Math.floor(this.height / 2);
        const toY = hero.position.y + Math.floor(this.height / 2);
        const missingTiles = [];
        const _tiles = {};
        for (let y = fromY; y <= toY; y++) {
            for (let x = fromX; x <= toX; x++) {
                _tiles[y] = _tiles[y] || {};
                if ((this.tiles[y]) && (this.tiles[y][x])) {
                    _tiles[y][x] = this.tiles[y][x];
                } else {
                    _tiles[y][x] = [];
                    missingTiles.push({x: x, y: y});
                }
            }
        }
        this.tiles = _tiles;
        this.requestTiles(missingTiles);
    }

    updateTile(x, y, stack) {
        if ((typeof this.tiles[y] != 'undefined') && (typeof this.tiles[y][x] != 'undefined')) {
            this.tiles[y][x] = stack;
        }
    }

    requestTiles(missingTiles) {
        setTimeout(() => {
            for (const tile of missingTiles) {
                const x = tile.x;
                const y = tile.y;
                const stack = [];

                if (!Math.floor(Math.random() * 16)) {

                } else {
                    stack.push('floor')
                    if (!Math.floor(Math.random() * 30)) {
                        stack.push('barrel');
                    } else if (!Math.floor(Math.random() * 30)) {
                        stack.push('chest');
                    } else if (!Math.floor(Math.random() * 30)) {
                        stack.push('wall');
                    }
                }

                this.updateTile(x, y, stack);
            }
        }, 250);
    }

    isWalkable(x, y) {
        if (typeof this.tiles[y] == 'undefined' || typeof this.tiles[y][x] == 'undefined') {
            return false
        }
        if (
            !this.tiles[y][x].find((item) => item === 'floor')
        ) {
            return false
        }
        if (this.tiles[y][x].find((item) => item === 'barrel')) {
            return false
        }
        if (this.tiles[y][x].find((item) => item === 'chest')) {
            return false
        }
        if (this.tiles[y][x].find((item) => item === 'wall')) {
            return false
        }

        return true;
    }
}
