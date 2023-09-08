class Board {

    static ctx = null;
    static width = null;
    static height = null;
    static tiles = {};

    static init(width, height) {
        const canvas = document.createElement('canvas');
        canvas.id = 'board';
        canvas.width = TILE_SIZE * BOARD_WIDTH;
        canvas.height = TILE_SIZE * BOARD_HEIGHT;
        document.querySelector('#app').append(canvas);

        Board.ctx = canvas.getContext("2d");
        Board.width = width;
        Board.height = height;
        Board.update();
        window.addEventListener("hero-position-changed", () => {
            Board.update()
        });
    }

    static update() {
        const fromX = hero.position.x - Math.floor(Board.width / 2);
        const toX = hero.position.x + Math.floor(Board.width / 2);
        const fromY = hero.position.y - Math.floor(Board.height / 2);
        const toY = hero.position.y + Math.floor(Board.height / 2);
        const missingTiles = [];
        const _tiles = {};
        for (let y = fromY; y <= toY; y++) {
            for (let x = fromX; x <= toX; x++) {
                _tiles[y] = _tiles[y] || {};
                if ((Board.tiles[y]) && (Board.tiles[y][x])) {
                    _tiles[y][x] = Board.tiles[y][x];
                } else {
                    _tiles[y][x] = [];
                    missingTiles.push({x: x, y: y});
                }
            }
        }
        Board.tiles = _tiles;
        Board.requestTiles(missingTiles);
    }

    static getTileStack(x, y) {
        if (typeof Board.tiles[y] == 'undefined' || typeof Board.tiles[y][x] == 'undefined') {
            return []
        }

        return Board.tiles[y][x];
    }

    static getTileTopItem(x, y) {
        const stack = Board.getTileStack(x, y);

        return stack[stack.length-1] ?? null;
    }

    static updateTile(x, y, stack) {
        if ((typeof Board.tiles[y] != 'undefined') && (typeof Board.tiles[y][x] != 'undefined')) {
            Board.tiles[y][x] = stack;
        }
    }

    static requestTiles(missingTiles) {
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
                } else if (!Math.floor(Math.random() * 30)) {
                    stack.push(8);
                }

                Board.updateTile(x, y, stack);
            }
        }, 100);
    }

    static isWalkable(x, y) {
        const stack = Board.getTileStack(x, y);

        if (!stack.find((itemId) => Item.get(itemId).type === 'ground')) {
            return false
        }
        if (stack.find((itemId) => Item.get(itemId).isBlockingCreatures)) {
            return false
        }

        return true;
    }

    static positionLocalToServer(x, y) {
        const fromX = hero.position.x - Math.floor(Board.width / 2);
        const fromY = hero.position.y - Math.floor(Board.height / 2);

        return {
            x: fromX + x,
            y: fromY + y,
        }
    }
}
