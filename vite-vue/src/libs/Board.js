import {BOARD_HEIGHT, BOARD_WIDTH, DEVICE_BREAKPOINT, SCALE_DESKTOP, SCALE_MOBILE, TILE_SIZE} from "../config.js";
import Item from "./Item.js";
import {$hero} from "../utils/globals.js";
import WebsocketRequest from "./WebsocketRequest.js";
import Effect from "./Effect.js";
import Creature from "./Creature.js";

export default class Board {

    static ctx = null;
    static hudCtx = null;
    static scale = window.innerWidth <= DEVICE_BREAKPOINT ? SCALE_MOBILE : SCALE_DESKTOP;
    static width = null;
    static height = null;
    static firstTilePosition = {};
    static lastTilePosition = {};
    static tiles = {};
    static effects = {};
    static creatures = {};

    static init() {
        const canvas = document.createElement('canvas');
        canvas.id = 'board';
        canvas.width = TILE_SIZE * BOARD_WIDTH;
        canvas.height = TILE_SIZE * BOARD_HEIGHT;
        canvas.style.transform = 'scale(' + Board.scale + ')';
        document.querySelector('#app').append(canvas);

        const hud = document.createElement('canvas');
        hud.id = 'hud';
        hud.width = TILE_SIZE * BOARD_WIDTH * Board.scale;
        hud.height = TILE_SIZE * BOARD_HEIGHT * Board.scale;
        document.querySelector('#app').append(hud);

        Board.ctx = canvas.getContext("2d");
        Board.hudCtx = hud.getContext("2d");
        Board.width = BOARD_WIDTH;
        Board.height = BOARD_HEIGHT;
        Board.update();

        window.addEventListener("hero-position-changed", () => {
            Board.update()
        });
        window.addEventListener("update-tile", (event) => {
            Board.updateTile(event.detail.position, event.detail.stack);
        });
        window.addEventListener("run-effect", (event) => {
            Effect.get(event.detail.effect).run(event.detail.position);
        });
        window.addEventListener("add-creature", (event) => {
            new Creature(event.detail.name, event.detail.position)
        });
        window.addEventListener("resize", Board.onResize);
    }

    static update() {
        Board.firstTilePosition = {
            x: $hero.position.x - Math.floor(Board.width / 2),
            y: $hero.position.y - Math.floor(Board.height / 2),
        };
        Board.lastTilePosition = {
            x: $hero.position.x + Math.floor(Board.width / 2),
            y: $hero.position.y + Math.floor(Board.height / 2),
        };

        for (const [name, creature] of Object.entries(Board.creatures)) {
            if (!Board.isOnArea(creature.position)) {
                delete Board.creatures[name];
            }
        }

        const missingTilesPositions = [];
        const _tiles = {};
        for (let y = Board.firstTilePosition.y; y <= Board.lastTilePosition.y; y++) {
            for (let x = Board.firstTilePosition.x; x <= Board.lastTilePosition.x; x++) {
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
        WebsocketRequest.requestTiles(missingTilesPositions);
    }

    static getTileStack(position) {
        if (typeof Board.tiles[position.y] == 'undefined' || typeof Board.tiles[position.y][position.x] == 'undefined') {
            return []
        }

        return Board.tiles[position.y][position.x];
    }

    static getTileTopItem(position) {
        const stack = Board.getTileStack(position);

        return stack[stack.length - 1] ?? null;
    }

    static updateTile(position, stack) {
        if ((typeof Board.tiles[position.y] != 'undefined') && (typeof Board.tiles[position.y][position.x] != 'undefined')) {
            Board.tiles[position.y][position.x] = stack;
        }
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
        return (position.x >= Board.firstTilePosition.x && position.x <= Board.lastTilePosition.x) && (position.y >= Board.firstTilePosition.y && position.y <= Board.lastTilePosition.y);
    }

    static positionClientToServer(position) {
        return {
            x: position.x + Board.firstTilePosition.x,
            y: position.y + Board.firstTilePosition.y,
        }
    }

    static positionServerToClient(position) {
        return {
            x: position.x - Board.firstTilePosition.x,
            y: position.y - Board.firstTilePosition.y,
        }
    }

    static getVisibleEffectsSprites(position) {
        if (Board.effects && Board.effects[position.y] && Board.effects[position.y][position.x]) {
            return Object.values(this.effects[position.y][position.x]);
        }

        return [];
    }

    static onResize() {
        const scale = window.innerWidth <= DEVICE_BREAKPOINT ? SCALE_MOBILE : SCALE_DESKTOP;
        if (Board.scale !== scale) {
            Board.scale = scale;
            Board.ctx.canvas.style.transform = 'scale(' + Board.scale + ')';
            Board.hudCtx.canvas.width = TILE_SIZE * BOARD_WIDTH * Board.scale;
            Board.hudCtx.canvas.height = TILE_SIZE * BOARD_HEIGHT * Board.scale;
        }
    }
}
