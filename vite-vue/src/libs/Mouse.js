import {TILE_SIZE} from "../config.js";
import {isPositionInRange, isSamePosition} from "../utils/position.js";
import Board from "./Board.js";
import Effect from "./Effect.js";
import Item from "./Item.js";
import Keyboard from "./Keyboard.js";
import Movement from "./Movement.js";
import Sprite from "./Sprite.js";
import {$hero} from "../utils/globals.js";

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
            isPressed: false,
        },
        right: {
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

    static pointerEffect = null;

    static init() {
        document.addEventListener('mousemove', (e) => {
            Mouse.recalcMousePosition(e);
            if (Mouse.grabbing.initialised && !Mouse.grabbing.itemId) {
                Mouse.grabItemFrom({...Mouse.positionServer});
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
            x: Math.floor((Mouse.positionCanvas.x + $hero.offset.x) / TILE_SIZE),
            y: Math.floor((Mouse.positionCanvas.y + $hero.offset.y) / TILE_SIZE),
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
        if (itemId && Item.get(itemId).isMovable) {
            Mouse.grabbing.itemId = null;
            Mouse.grabbing.position = {x: null, y: null};
            Mouse.grabbing.initialised = true;
        }
    }

    static onLeftButtonRelease() {
        if (Mouse.grabbing.initialised && Mouse.grabbing.itemId) {
            Mouse.releaseItemOn({...Mouse.positionServer});
        } else {
            const pointerEffectSprite = Sprite.get('pointer-cross-yellow').clone();
            const pointerEffect = {
                sprite: pointerEffectSprite,
                position: {...Mouse.positionCanvas},
            }
            pointerEffectSprite.play().then(() => {
                if (Mouse.pointerEffect === pointerEffect) {
                    Mouse.pointerEffect = null
                }
            });
            Mouse.pointerEffect = pointerEffect;

            Mouse.grabbing.initialised = false;
            Mouse.grabbing.itemId = null;
            Mouse.grabbing.position = {x: null, y: null};
            Movement.setPath(Mouse.positionServer, 'walk');
        }
    }

    static onRightButtonPress() {
        const position = {...Mouse.positionServer};
        const itemId = Board.getTileTopItem(position);
        if (!itemId) return;
        if (!isPositionInRange($hero.position, position)) return;

        if (Item.get(itemId).isUsable) {
            const pointerEffectSprite = Sprite.get('pointer-cross-red').clone();
            const pointerEffect = {
                sprite: pointerEffectSprite,
                position: {...Mouse.positionCanvas},
            }
            pointerEffectSprite.play().then(() => {
                if (Mouse.pointerEffect === pointerEffect) {
                    Mouse.pointerEffect = null
                }
            });
            Mouse.pointerEffect = pointerEffect;
            Mouse.use(Mouse.positionServer, itemId);
        }
    }

    static onRightButtonRelease()
    {
        const item = Item.get(Board.getTileTopItem(Mouse.positionServer));
        if (item.isUsable && !isPositionInRange($hero.position, Mouse.positionServer)) {
            const pointerEffectSprite = Sprite.get('pointer-cross-red').clone();
            const pointerEffect = {
                sprite: pointerEffectSprite,
                position: {...Mouse.positionCanvas},
            }
            pointerEffectSprite.play().then(() => {
                if (Mouse.pointerEffect === pointerEffect) {
                    Mouse.pointerEffect = null
                }
            });
            Mouse.pointerEffect = pointerEffect;
            Movement.setPath(Mouse.positionServer, 'use', {
                itemId: item.id
            });
        }
    }

    static use(position, itemId) {
        if (Board.getTileTopItem(position) !== itemId) return;
        if (!isPositionInRange($hero.position, position)) return;

        if (itemId === 6) {
            Effect.get('ore-hit').run(position);
            Board.tiles[position.y][position.x].pop();
            Board.tiles[position.y][position.x].push(9);
            Mouse.onPositionChange();
        }

        if (itemId === 8) {
            Effect.get('ore-hit').run(position);
            Board.tiles[position.y][position.x].push(10);
        }

        if (itemId === 9) {
            Effect.get('yellow-sparkles').run($hero.position);
        }
    }

    static grabItemFrom(position) {
        Mouse.grabbing.itemId = Board.getTileTopItem(position);
        Mouse.grabbing.position = position;
        Board.ctx.canvas.setAttribute('cursor', 'crosshair');
    }

    static releaseItemOn(position) {
        const positionFrom = {...Mouse.grabbing.position};
        const positionTo = {...position};
        const itemId = Mouse.grabbing.itemId;

        Mouse.grabbing.initialised = false;
        Mouse.grabbing.itemId = null;
        Mouse.grabbing.position = {x: null, y: null};
        Mouse.onPositionChange();

        if (isSamePosition(positionFrom, Mouse.positionServer)) {
            return;
        }
        if (itemId !== Board.getTileTopItem(positionFrom)) {
            return;
        }
        if (!isPositionInRange($hero.position, positionFrom)) {
            Movement.setPath(positionFrom, 'move', {
                itemId: itemId,
                positionFrom: positionFrom,
                positionTo: positionTo,
            })
            return;
        }
        if (Board.getTileStack(positionTo).find((itemId) => Item.get(itemId).isBlockingItems)) {
            return;
        }

        Board.tiles[positionFrom.y][positionFrom.x].pop();
        Board.tiles[positionTo.y][positionTo.x].push(itemId);
    }
}
