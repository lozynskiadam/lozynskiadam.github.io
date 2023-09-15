import {TILE_SIZE} from "../config.js";
import {isPositionInRange, isSamePosition} from "../utils/position.js";
import Board from "./Board.js";
import Effect from "./Effect.js";
import Hero from "./Hero.js";
import Item from "./Item.js";
import Keyboard from "./Keyboard.js";
import Movement from "./Movement.js";
import Sprite from "./Sprite.js";

export default class Mouse {

    static positionWindow = {
        x: null,
        y: null,
    }

    static positionCanvas = {
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
        initialised: false,
        itemId: null,
        position: {
            x: null,
            y: null,
        },
    }

    static pointerEffects = null;

    static init() {
        document.addEventListener('mousemove', (e) => {
            Mouse.recalcMousePosition(e);
            if (Mouse.grabbing.initialised && !Mouse.grabbing.itemId) {
                Mouse.onGrabStart();
            }
        }, false);

        document.addEventListener('mousedown', (e) => {
            Mouse.recalcMousePosition(e);
            if (e.which === 1 || e.button === 0) {
                Mouse.buttons.left.isPressed = true;
                Mouse.onLeftButtonPress();
            }
            if (e.which === 3 || e.button === 2) {
                Mouse.buttons.right.isPressed = true;
                Mouse.onRightButtonPress();
            }
        }, false);

        document.addEventListener('mouseup', (e) => {
            Mouse.recalcMousePosition(e);
            if (e.which === 1 || e.button === 0) {
                Mouse.buttons.left.isPressed = false;
                Mouse.onLeftButtonRelease();
            }
            if (e.which === 3 || e.button === 2) {
                Mouse.buttons.right.isPressed = false;
                Mouse.onRightButtonRelease();
            }
        }, false);

        document.addEventListener('contextmenu', e => e?.cancelable && e.preventDefault());
    }

    static recalcMousePosition(e) {
        const rect = Board.ctx.canvas.getBoundingClientRect();
        const old = {
            positionWindow: {...Mouse.positionWindow},
            positionClient: {...Mouse.positionClient},
            positionServer: {...Mouse.positionServer},
        };

        Mouse.positionWindow = {
            x: e.clientX,
            y: e.clientY
        };

        Mouse.positionCanvas = {
            x: ((e.clientX - rect.left) / (rect.right - rect.left) * Board.ctx.canvas.width),
            y: ((e.clientY - rect.top) / (rect.bottom - rect.top) * Board.ctx.canvas.height),
        };

        Mouse.positionClient = {
            x: Math.floor((Mouse.positionCanvas.x + Hero.creature.offset.x) / TILE_SIZE),
            y: Math.floor((Mouse.positionCanvas.y + Hero.creature.offset.y) / TILE_SIZE),
        };

        Mouse.positionServer = Board.positionClientToServer(Mouse.positionClient);

        if (!isSamePosition(Mouse.positionClient, old.positionClient)) {
            Mouse.onPositionChange();
        }
        if (!isSamePosition(Mouse.positionServer, old.positionServer)) {
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

        Mouse.positionServer = Board.positionClientToServer(Mouse.positionClient);

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

    static onLeftButtonPress() {
        if (Keyboard.shift.isPressed) {
            return;
        }

        const itemId = Board.getTileTopItem(Mouse.positionServer);
        if (itemId && Item.get(itemId).isMoveable) {
            Mouse.grabbing.itemId = null;
            Mouse.grabbing.position = {x: null, y: null};
            Mouse.grabbing.initialised = true;
            return;
        }
    }

    static onLeftButtonRelease() {
        if (Mouse.grabbing.initialised && Mouse.grabbing.itemId) {
            Mouse.onGrabEnd();
        } else {
            const pointerEffectSprite = Sprite.get('effect-energy').clone();
            pointerEffectSprite.play().then(() => Mouse.pointerEffects = null);
            Mouse.pointerEffects = {
                sprite: pointerEffectSprite,
                position: {...Mouse.positionCanvas},
            }

            Mouse.grabbing.initialised = false;
            Mouse.grabbing.itemId = null;
            Mouse.grabbing.position = {x: null, y: null};
            Movement.setTargetPath(Mouse.positionServer);
        }
    }

    static onRightButtonPress() {
        const itemId = Board.getTileTopItem(Mouse.positionServer);
        if (Mouse.buttons.right.isBlocked) return;
        if (!itemId) return;
        if (!isPositionInRange(Hero.creature.position, Mouse.positionServer)) return;

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

    static onRightButtonRelease()
    {
        const item = Item.get(Board.getTileTopItem(Mouse.positionServer));
        if (item.type === 'object' && !isPositionInRange(Hero.creature.position, Mouse.positionServer)) {
            Movement.setTargetPath(Mouse.positionServer, true);
        }
    }

    static onGrabStart() {
        Mouse.grabbing.itemId = Board.getTileTopItem(Mouse.positionServer);
        Mouse.grabbing.position = {...Mouse.positionServer};
        Board.ctx.canvas.setAttribute('cursor', 'crosshair');
    }

    static onGrabEnd() {
        Mouse.handleThrow();
        Mouse.grabbing.initialised = false;
        Mouse.grabbing.itemId = null;
        Mouse.grabbing.position = {x: null, y: null};
        Mouse.onPositionChange();
    }

    static handleThrow() {
        if (isPositionInRange(Hero.creature.position, Mouse.grabbing.position) === false) {
            return;
        }
        if (isSamePosition(Mouse.grabbing.position, Mouse.positionServer)) {
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
