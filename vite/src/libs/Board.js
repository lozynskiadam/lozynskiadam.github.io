import {BOARD_HEIGHT, BOARD_WIDTH, TILE_SIZE} from "../config.js";
import Hero from "./Hero.js";
import Utils from "./Utils.js";
import Item from "./Item.js";

export default class Board {

    static ctx = null;
    static width = null;
    static height = null;
    static tiles = {};
    static effects = {};

    static init() {
        const canvas = document.createElement('canvas');
        canvas.id = 'board';
        canvas.width = TILE_SIZE * BOARD_WIDTH;
        canvas.height = TILE_SIZE * BOARD_HEIGHT;
        document.querySelector('#app').append(canvas);

        Board.ctx = canvas.getContext("2d");
        Board.width = BOARD_WIDTH;
        Board.height = BOARD_HEIGHT;
        Board.update();
        window.addEventListener("hero-position-changed", () => {
            Board.update()
        });
    }

    static update() {
        const fromX = Hero.position.x - Math.floor(Board.width / 2);
        const toX = Hero.position.x + Math.floor(Board.width / 2);
        const fromY = Hero.position.y - Math.floor(Board.height / 2);
        const toY = Hero.position.y + Math.floor(Board.height / 2);
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

                if (Utils.roll(40)) {
                    stack.push(2);
                } else if (Utils.roll(40)) {
                    stack.push(3);
                } else if (Utils.roll(5)) {
                    stack.push(4);
                } else {
                    stack.push(1)
                }

                if ((x === Hero.position.x && y === Hero.position.y) === false) {
                    if (Utils.roll(100)) {
                        stack.push(6);
                    } else if (Utils.roll(100)) {
                        stack.push(8);
                    }
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

    static isInMeleeRange(x, y) {
        if ((x === Hero.position.x - 1) || (x === Hero.position.x) || x === Hero.position.x + 1) {
            if ((y === Hero.position.y - 1) || (y === Hero.position.y) || y === Hero.position.y + 1) {
                return true;
            }
        }

        return false
    }

    static positionLocalToServer(x, y) {
        const fromX = Hero.position.x - Math.floor(Board.width / 2);
        const fromY = Hero.position.y - Math.floor(Board.height / 2);

        return {
            x: fromX + x,
            y: fromY + y,
        }
    }

    static getEffects(x, y) {
        if (Board.effects && Board.effects[y] && Board.effects[y][x]) {
            return Object.values(this.effects[y][x]);
        }

        return [];
    }
}
