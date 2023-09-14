import {BOARD_HEIGHT, BOARD_WIDTH, TILE_SIZE} from "../config.js";
import {randomString, roll} from "../utils/common.js";
import {isSamePosition} from "../utils/position.js";
import Hero from "./Hero.js";
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
            if (!Board.isOnArea(creature.position)) {
                delete Board.creatures[name];
            }
        }

        const missingTilesPositions = [];
        const _tiles = {};
        for (let y = Board.area.fromY; y <= Board.area.toY; y++) {
            for (let x = Board.area.fromX; x <= Board.area.toX; x++) {
                _tiles[y] = _tiles[y] || {};
                if ((Board.tiles[y]) && (Board.tiles[y][x])) {
                    _tiles[y][x] = Board.tiles[y][x];
                } else {
                    _tiles[y][x] = [];
                    missingTilesPositions.push({x: x, y: y});
                }
            }
        }
        Board.tiles = _tiles;
        Board.requestTiles(missingTilesPositions);
    }

    static getTileStack(position) {
        if (typeof Board.tiles[position.y] == 'undefined' || typeof Board.tiles[position.y][position.x] == 'undefined') {
            return []
        }

        return Board.tiles[position.y][position.x];
    }

    static getTileTopItem(position) {
        const stack = Board.getTileStack(position);

        return stack[stack.length-1] ?? null;
    }

    static updateTile(position, stack) {
        if ((typeof Board.tiles[position.y] != 'undefined') && (typeof Board.tiles[position.y][position.x] != 'undefined')) {
            Board.tiles[position.y][position.x] = stack;
        }
    }

    static requestTiles(missingTilesPositions) {
        setTimeout(() => {
            for (const position of missingTilesPositions) {
                const stack = [];

                if (roll(40)) {
                    stack.push(2);
                } else if (roll(40)) {
                    stack.push(3);
                } else if (roll(30)) {
                    stack.push(4);
                } else {
                    stack.push(1)
                }

                if (!isSamePosition(position, Hero.creature.position)) {
                    if (roll(100)) {
                        stack.push(6);
                    } else if (roll(100)) {
                        stack.push(8);
                    }
                }

                Board.updateTile(position, stack);

                if (roll(350)) {
                    new Creature(randomString(20), position, {x: 0, y: 0})
                }
            }
        }, 100);
    }

    static isWalkable(position) {
        const stack = Board.getTileStack(position);

        if (!stack.find((itemId) => Item.get(itemId).type === 'ground')) {
            return false
        }
        if (stack.find((itemId) => Item.get(itemId).isBlockingCreatures)) {
            return false
        }

        return true;
    }

    static isOnArea(position) {
        return (position.x >= Board.area.fromX && position.x <= Board.area.toX) && (position.y >= Board.area.fromY && position.y <= Board.area.toY);
    }

    static positionLocalToServer(position) {
        return {
            x: Board.area.fromX + position.x,
            y: Board.area.fromY + position.y,
        }
    }

    static getVisibleEffectsSprites(position) {
        if (Board.effects && Board.effects[position.y] && Board.effects[position.y][position.x]) {
            return Object.values(this.effects[position.y][position.x]);
        }

        return [];
    }
}
