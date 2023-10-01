import {TILE_SIZE} from "../config.js";
import {isPosition, isPositionInRange, isSamePosition} from "../utils/position.js";
import Board from "./Board.js";
import Item from "./Item.js";
import Keyboard from "./Keyboard.js";
import Movement from "./Movement.js";
import Sprite from "./Sprite.js";
import {$app, $hero} from "../utils/globals.js";
import ServerEvent from "./ServerEvent.js";

export default class Mouse {

    static positionWindow = {x: null, y: null}

    static positionCanvas = {x: null, y: null}

    static positionClient = {x: null, y: null}

    static positionServer = {x: null, y: null}

    static isLeftButtonPressed = false;

    static isRightButtonPressed = false;

    static grabbing = {
        itemId: null,
        position: {
            x: null,
            y: null,
        },
    }

    static effect = null;

    static init() {
        document.addEventListener('mousemove', (e) => {
            Mouse.recalcMousePosition(e);
            if (Mouse.isLeftButtonPressed && !Mouse.grabbing.itemId) {
                Mouse.grabItem({...Mouse.positionServer});
            }
        }, false);

        document.addEventListener('mousedown', (e) => {
            Mouse.recalcMousePosition(e);
            if (e.which === 1 || e.button === 0) {
                Mouse.isLeftButtonPressed = true;
                Mouse.onLeftButtonPress(e);
            }
            if (e.which === 3 || e.button === 2) {
                Mouse.isRightButtonPressed = true;
                Mouse.onRightButtonPress(e);
            }
        }, false);

        document.addEventListener('mouseup', (e) => {
            Mouse.recalcMousePosition(e);
            if (e.which === 1 || e.button === 0) {
                Mouse.isLeftButtonPressed = false;
                Mouse.onLeftButtonRelease(e);
            }
            if (e.which === 3 || e.button === 2) {
                Mouse.isRightButtonPressed = false;
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

        if (!isSamePosition(Mouse.positionClient, old.positionClient) || !isSamePosition(Mouse.positionServer, old.positionServer)) {
            Mouse.updateCursorAndServerPosition();
        } else {
            Mouse.positionServer = Board.positionClientToServer(Mouse.positionClient);
        }
    }

    static updateCursorAndServerPosition() {
        Mouse.positionServer = Board.positionClientToServer(Mouse.positionClient);
        if (Mouse.grabbing.itemId) {
            return;
        }
        if (Keyboard.shift.isPressed) {
            $app.setAttribute('cursor', 'eye');
            return;
        }

        const itemId = Board.getTileTopItem(Mouse.positionServer);
        if (!itemId) {
            $app.removeAttribute('cursor');
        } else if (itemId === 6) {
            $app.setAttribute('cursor', 'chest');
        } else if (itemId === 8) {
            $app.setAttribute('cursor', 'pick');
        } else {
            $app.removeAttribute('cursor');
        }
    }

    static onLeftButtonPress(e) {

    }

    static onLeftButtonRelease(e) {

        // release grab
        if (Mouse.grabbing.itemId) {
            if (e.target.id === "board") {
                Mouse.releaseItem({...Mouse.positionServer});
            } else if (e.target.classList && e.target.classList.contains('slot')) {
                Mouse.releaseItem(e.target.getAttribute('data-slot-index'), {...Mouse.positionServer});
            } else {
                Mouse.cleanGrab();
                Mouse.updateCursorAndServerPosition();
            }
            return;
        }

        Mouse.cleanGrab();
        if (e.target.id !== "board") return;

        const position = {...Mouse.positionServer};
        const itemId = Board.getTileTopItem(position);
        const item = Item.get(itemId);

        if (item.isUsable) {
            const effectSprite = Sprite.get('pointer-cross-red').clone();
            const effect = {
                sprite: effectSprite,
                position: {...Mouse.positionCanvas},
            }
            effectSprite.play().then(() => {
                if (Mouse.effect === effect) {
                    Mouse.effect = null
                }
            });
            Mouse.effect = effect;
            if (isPositionInRange($hero.position, position)) {
                ServerEvent.use(position, itemId);
            } else {
                Movement.setPath(Mouse.positionServer, 'use', {
                    itemId: item.id
                });
            }
            return;
        }

        if (!item.isUsable) {
            const effectSprite = Sprite.get('pointer-cross-yellow').clone();
            const effect = {
                sprite: effectSprite,
                position: {...Mouse.positionCanvas},
            }
            effectSprite.play().then(() => {
                if (Mouse.effect === effect) {
                    Mouse.effect = null
                }
            });
            Mouse.effect = effect;
            Movement.setPath(Mouse.positionServer, 'walk');
        }
    }

    static onRightButtonPress() {
    }

    static onRightButtonRelease() {
    }

    static grabItem(source) {
        const itemId = Board.getTileTopItem(source);
        if (!Item.get(itemId).isMovable) {
            return;
        }
        Mouse.grabbing.itemId = itemId;
        Mouse.grabbing.position = source;
        $app.setAttribute('cursor', 'crosshair');
    }

    static releaseItem(target) {
        const item = Item.get(Mouse.grabbing.itemId);
        const positionFrom = {...Mouse.grabbing.position};
        Mouse.cleanGrab();
        Mouse.updateCursorAndServerPosition();

        if (isPosition(target)) {
            if (isSamePosition(positionFrom, target)) {
                return;
            }
            if (isPositionInRange($hero.position, positionFrom)) {
                ServerEvent.moveItem(positionFrom, target, item.id);
            } else {
                Movement.setPath(positionFrom, 'move', {
                    itemId: item.id,
                    positionFrom: positionFrom,
                    positionTo: target,
                })
                return;
            }
        }

        if (!isPosition(target)) {
            if (!item.isPickupable) {
                return;
            }
            if (isPositionInRange($hero.position, positionFrom)) {
                ServerEvent.pickUp(item.id, positionFrom, target);
            } else {
                Movement.setPath(positionFrom, 'pick-up', {
                    itemId: item.id,
                    positionFrom: positionFrom,
                    slot: target,
                })
            }
        }
    }

    static cleanGrab() {
        Mouse.grabbing.itemId = null;
        Mouse.grabbing.position = {x: null, y: null};
    }
}
