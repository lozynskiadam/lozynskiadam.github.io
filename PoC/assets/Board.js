class Board {

    width = 5;
    height = 5;
    tiles = {};

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
                    _tiles[y][x] = null;
                    missingTiles.push({x: x, y: y});
                }
            }
        }
        this.tiles = _tiles;
        this.requestTiles(missingTiles);
    }

    requestTiles(missingTiles) {
        setTimeout(() => {
            for (const tile of missingTiles) {
                const x = tile.x;
                const y = tile.y;
                const rand = Math.floor(Math.random() * 2) + 1;
                if ((typeof this.tiles[y] != 'undefined') && (typeof this.tiles[y][x] != 'undefined')) {
                    this.tiles[y][x] = [rand];
                }
            }
        }, 500);
    }
}
