class Board {

    width = null;
    height = null;
    tiles = {};

    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.update();
        window.addEventListener("hero-position-changed", () => {
            this.update()
        });
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

                if (!Math.floor(Math.random() * 40)) {
                    stack.push(2);
                } else if (!Math.floor(Math.random() * 40)) {
                    stack.push(3);
                } else if (!Math.floor(Math.random() * 5)) {
                    stack.push(4);
                } else {
                    stack.push(1)
                }

                if (!Math.floor(Math.random() * 30)) {
                    stack.push(5);
                } else if (!Math.floor(Math.random() * 75)) {
                    stack.push(6);
                } else if (!Math.floor(Math.random() * 10)) {
                    stack.push(7);
                }

                this.updateTile(x, y, stack);
            }
        }, 250);
    }

    isWalkable(x, y) {
        if (typeof this.tiles[y] == 'undefined' || typeof this.tiles[y][x] == 'undefined') {
            return false
        }
        if (!this.tiles[y][x].find((itemId) => Item.get(itemId).type === 'ground')) {
            return false
        }
        if (this.tiles[y][x].find((itemId) => Item.get(itemId).isBlockingCreatures)) {
            return false
        }

        return true;
    }

    positionLocalToServer(x, y) {
        const fromX = hero.position.x - Math.floor(this.width / 2);
        const fromY = hero.position.y - Math.floor(this.height / 2);

        return {
            x: fromX + x,
            y: fromY + y,
        }
    }
}
