import {TILE_SIZE} from "../config.js";
import Board from "./Board.js";
import Effect from "./Effect.js";
import Hero from "./Hero.js";
import Item from "./Item.js";
import Keyboard from "./Keyboard.js";
import Utils from "./Utils.js";

export default class Mouse {

    static positionWindow = {
        x: null,
        y: null,
    }

    static positionClient = {
        x: null,
        y: null,
    }

    static positionServer = {
        x: null,
        y: null,
    }

    static buttons = {
        left: {
            isBlocked: false,
            isPressed: false,
        },
        right: {
            isBlocked: false,
            isPressed: false,
        },
    }

    static grabbing = {
        itemId: null,
        position: {
            x: null,
            y: null,
        },
    }

    static init() {
        document.addEventListener('mousemove', Mouse.onMove, false);
        document.addEventListener('mousedown', (e) => {
            if (e.which === 1 || e.button === 0) {
                Mouse.buttons.left.isPressed = true;
                Mouse.onLeftButtonClick();
            }
            if (e.which === 3 || e.button === 2) {
                Mouse.buttons.right.isPressed = true;
                Mouse.onRightButtonClick();
            }
        });
        document.addEventListener('mouseup', (e) => {
            if (e.which === 1 || e.button === 0) {
                Mouse.buttons.left.isPressed = false;
                if (Mouse.grabbing.itemId) {
                    Mouse.onGrabEnd();
                }
            }
            if (e.which === 3 || e.button === 2) {
                Mouse.buttons.right.isPressed = false;
            }
        });
        document.addEventListener('contextmenu', e => e?.cancelable && e.preventDefault());
    }

    static onMove(e) {
        const rect = Board.ctx.canvas.getBoundingClientRect();
        const old = {
            window: {...Mouse.positionWindow},
            client: {...Mouse.positionClient},
            server: {...Mouse.positionServer},
        };

        Mouse.positionWindow = {
            x: e.clientX,
            y: e.clientY
        };

        Mouse.positionClient = {
            x: Math.floor((((e.clientX - rect.left) / (rect.right - rect.left) * Board.ctx.canvas.width) + Hero.creature.offset.x) / TILE_SIZE),
            y: Math.floor((((e.clientY - rect.top) / (rect.bottom - rect.top) * Board.ctx.canvas.height) + Hero.creature.offset.y) / TILE_SIZE),
        };

        Mouse.positionServer = Board.positionLocalToServer(Mouse.positionClient);

        if (!Utils.areEqual(Mouse.positionClient, old.client)) {
            Mouse.onPositionChange();
        }
        if (!Utils.areEqual(Mouse.positionServer, old.server)) {
            Mouse.onPositionChange();
        }
    }

    static onPositionChange() {
        if (Mouse.grabbing.itemId) {
            return;
        }
        if (Keyboard.shift.isPressed) {
            Board.ctx.canvas.setAttribute('cursor', 'eye');
            return;
        }

        Mouse.positionServer = Board.positionLocalToServer(Mouse.positionClient);

        const itemId = Board.getTileTopItem(Mouse.positionServer);
        if (!itemId) {
            Board.ctx.canvas.removeAttribute('cursor');
            return;
        }

        if (itemId === 6) {
            Board.ctx.canvas.setAttribute('cursor', 'chest');
        } else if (itemId === 8) {
            Board.ctx.canvas.setAttribute('cursor', 'pick');
        } else {
            Board.ctx.canvas.removeAttribute('cursor');
        }
    }

    static onLeftButtonClick() {
        if (Keyboard.shift.isPressed) {
            return;
        }
        const itemId = Board.getTileTopItem(Mouse.positionServer);
        if (itemId && Item.get(itemId).isMoveable) {
            Mouse.onGrabStart(itemId);
            return;
        }
    }

    static onRightButtonClick() {
        const itemId = Board.getTileTopItem(Mouse.positionServer);
        if (Mouse.buttons.right.isBlocked) return;
        if (!itemId) return;
        if (!Board.isInHeroRange(Mouse.positionServer)) return;

        if (itemId === 6) {
            Mouse.buttons.right.isBlocked = true;
            Effect.get('yellow-sparkles').run(Mouse.positionServer);
            Board.tiles[Mouse.positionServer.y][Mouse.positionServer.x].pop();
            Board.tiles[Mouse.positionServer.y][Mouse.positionServer.x].push(9);
            Mouse.onPositionChange();
            setTimeout(() => {
                Mouse.buttons.right.isBlocked = false;
            }, 600);
            return;
        }

        if (itemId === 8) {
            Mouse.buttons.right.isBlocked = true;
            Effect.get('ore-hit').run(Mouse.positionServer);
            Board.tiles[Hero.creature.position.y][Hero.creature.position.x].push(10);
            setTimeout(() => {
                Mouse.buttons.right.isBlocked = false;
            }, 600);
            return;
        }
    }

    static onGrabStart(itemId) {
        Mouse.grabbing.itemId = itemId;
        Mouse.grabbing.position = {...Mouse.positionServer};
        Board.ctx.canvas.setAttribute('cursor', 'crosshair');
    }

    static onGrabEnd() {
        Mouse.handleThrow();
        Mouse.grabbing.itemId = null;
        Mouse.grabbing.position = {x: null, y: null};
        Mouse.onPositionChange();
    }

    static handleThrow() {
        if (Board.isInHeroRange(Mouse.grabbing.position) === false) {
            return;
        }
        if (Utils.areEqual(Mouse.grabbing.position, Mouse.positionServer)) {
            return;
        }
        const itemId = Board.getTileTopItem(Mouse.grabbing.position);
        if (itemId !== Mouse.grabbing.itemId) {
            return;
        }
        if (Board.getTileStack(Mouse.positionServer).find((itemId) => Item.get(itemId).isBlockingCreatures)) {
            return;
        }

        Board.tiles[Mouse.grabbing.position.y][Mouse.grabbing.position.x].pop();
        Board.tiles[Mouse.positionServer.y][Mouse.positionServer.x].push(itemId);
    }
}
