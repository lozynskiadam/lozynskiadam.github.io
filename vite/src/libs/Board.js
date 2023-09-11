import {BOARD_HEIGHT, BOARD_WIDTH, TILE_SIZE} from "../config.js";
import Hero from "./Hero.js";
import Utils from "./Utils.js";
import Item from "./Item.js";
import Creature from "./Creature.js";

export default class Board {

    static ctx = null;
    static width = null;
    static height = null;
    static tiles = {};
    static effects = {};
    static creatures = {};
    static area = {
        fromX: null,
        fromY: null,
        toX: null,
        toY: null,
    }

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
        Board.area.fromX = Hero.creature.position.x - Math.floor(Board.width / 2);
        Board.area.toX = Hero.creature.position.x + Math.floor(Board.width / 2);
        Board.area.fromY = Hero.creature.position.y - Math.floor(Board.height / 2);
        Board.area.toY = Hero.creature.position.y + Math.floor(Board.height / 2);

        for (const [name, creature] of Object.entries(Board.creatures)) {
            if (!Board.isOnArea(creature.position.x, creature.position.y)) {
                delete Board.creatures[name];
            }
        }

        const missingTiles = [];
        const _tiles = {};
        for (let y = Board.area.fromY; y <= Board.area.toY; y++) {
            for (let x = Board.area.fromX; x <= Board.area.toX; x++) {
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
                } else if (Utils.roll(30)) {
                    stack.push(4);
                } else {
                    stack.push(1)
                }

                if ((x === Hero.creature.position.x && y === Hero.creature.position.y) === false) {
                    if (Utils.roll(100)) {
                        stack.push(6);
                    } else if (Utils.roll(100)) {
                        stack.push(8);
                    }
                }

                Board.updateTile(x, y, stack);

                if (Utils.roll(350)) {
                    new Creature(Utils.randomString(20), {x: x, y: y}, {x: 0, y: 0})
                }
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

    static isInHeroRange(x, y, radius = 1) {
        const fromX = Hero.creature.position.x - radius;
        const fromY = Hero.creature.position.y - radius;
        const toX = Hero.creature.position.x + radius;
        const toY = Hero.creature.position.y + radius;

        return (x >= fromX && x <= toX) && (y >= fromY && y <= toY);
    }

    static isOnArea(x, y) {
        return (x >= Board.area.fromX && x <= Board.area.toX) && (y >= Board.area.fromY && y <= Board.area.toY);
    }

    static positionLocalToServer(x, y) {
        return {
            x: Board.area.fromX + x,
            y: Board.area.fromY + y,
        }
    }

    static getEffects(x, y) {
        if (Board.effects && Board.effects[y] && Board.effects[y][x]) {
            return Object.values(this.effects[y][x]);
        }

        return [];
    }
}
