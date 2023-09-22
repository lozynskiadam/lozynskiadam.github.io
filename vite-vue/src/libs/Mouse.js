import {TILE_SIZE} from "../config.js";
import {isPositionInRange, isSamePosition} from "../utils/position.js";
import Board from "./Board.js";
import Effect from "./Effect.js";
import Item from "./Item.js";
import Keyboard from "./Keyboard.js";
import Movement from "./Movement.js";
import Sprite from "./Sprite.js";
import {$app, $hero} from "../utils/globals.js";
import ServerEvent from "./ServerEvent.js";

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
                Mouse.onLeftButtonPress(e);
            }
            if (e.which === 3 || e.button === 2) {
                Mouse.buttons.right.isPressed = true;
                Mouse.onRightButtonPress(e);
            }
        }, false);

        document.addEventListener('mouseup', (e) => {
            Mouse.recalcMousePosition(e);
            if (e.which === 1 || e.button === 0) {
                Mouse.buttons.left.isPressed = false;
                Mouse.onLeftButtonRelease(e);
            }
            if (e.which === 3 || e.button === 2) {
                Mouse.buttons.right.isPressed = false;
                Mouse.onRightButtonRelease(e);
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
            $app.setAttribute('cursor', 'eye');
            return;
        }

        Mouse.positionServer = Board.positionClientToServer(Mouse.positionClient);

        const itemId = Board.getTileTopItem(Mouse.positionServer);
        if (!itemId) {
            $app.removeAttribute('cursor');
            return;
        }

        if (itemId === 6) {
            $app.setAttribute('cursor', 'chest');
        } else if (itemId === 8) {
            $app.setAttribute('cursor', 'pick');
        } else {
            $app.removeAttribute('cursor');
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

    static onLeftButtonRelease(e) {
        if (Mouse.grabbing.initialised && Mouse.grabbing.itemId) {
            if (e.target.id === "board") {
                Mouse.releaseItemOn({...Mouse.positionServer});
            } else if (e.target.classList && e.target.classList.contains('slot')) {
                window.dispatchEvent(new CustomEvent('update-inventory-item', {
                    detail: {
                        slot: e.target.getAttribute('data-slot-index'),
                        item: Item.get(Mouse.grabbing.itemId)
                    }
                }));

                Mouse.grabbing.initialised = false;
                Mouse.grabbing.itemId = null;
                Mouse.grabbing.position = {x: null, y: null};
                Mouse.onPositionChange();
            } else {
                Mouse.grabbing.initialised = false;
                Mouse.grabbing.itemId = null;
                Mouse.grabbing.position = {x: null, y: null};
                Mouse.onPositionChange();
            }
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
            ServerEvent.use(Mouse.positionServer, itemId);
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

    static grabItemFrom(position) {
        Mouse.grabbing.itemId = Board.getTileTopItem(position);
        Mouse.grabbing.position = position;
        $app.setAttribute('cursor', 'crosshair');
    }

    static releaseItemOn(position) {
        const positionFrom = {...Mouse.grabbing.position};
        const positionTo = {...position};
        const itemId = Mouse.grabbing.itemId;

        Mouse.grabbing.initialised = false;
        Mouse.grabbing.itemId = null;
        Mouse.grabbing.position = {x: null, y: null};
        Mouse.onPositionChange();

        if (isPositionInRange($hero.position, positionFrom)) {
            ServerEvent.moveItem(positionFrom, positionTo, itemId);
        } else {
            if (isSamePosition(positionFrom, positionTo)) {
                return;
            }
            if (itemId !== Board.getTileTopItem(positionFrom)) {
                return;
            }
            Movement.setPath(positionFrom, 'move', {
                itemId: itemId,
                positionFrom: positionFrom,
                positionTo: positionTo,
            })
        }
    }
}
