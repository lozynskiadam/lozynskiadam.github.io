import {TILE_SIZE} from "../config.js";
import {isPosition, isPositionInRange, isSamePosition} from "../utils/position.js";
import Board from "./Board.js";
import ItemStructure from "./ItemStructure.js";
import Movement from "./Movement.js";
import Sprite from "./Sprite.js";
import {$app, $hero, $inventory} from "../utils/globals.js";
import WebsocketRequest from "./WebsocketRequest.js";

export default class Pointer {

    static positionWindow = {x: null, y: null}
    static positionCanvas = {x: null, y: null}
    static positionClient = {x: null, y: null}
    static positionServer = {x: null, y: null}
    static isLeftButtonPressed = false;
    static isRightButtonPressed = false;
    static grabbing = {
        itemId: null,
        source: null,
    }
    static effect = null;

    static init() {
        document.addEventListener('mousemove', (e) => {
            Pointer.recalcMousePosition(e);
            if (Pointer.isLeftButtonPressed && !Pointer.grabbing.itemId) {
                if (e.target.id === "board") {
                    Pointer.grabItemFromFloor({...Pointer.positionServer});
                } else if (e.target.classList && e.target.classList.contains('slot')) {
                    Pointer.grabItemFromInventory(e.target.dataset.slotIndex);
                }
            }
        }, false);

        document.addEventListener('mousedown', (e) => {
            Pointer.recalcMousePosition(e);
            if (e.which === 1 || e.button === 0) {
                Pointer.isLeftButtonPressed = true;
                Pointer.onLeftButtonPress(e);
            }
        }, false);

        document.addEventListener('mouseup', (e) => {
            Pointer.recalcMousePosition(e);
            if (e.which === 1 || e.button === 0) {
                Pointer.isLeftButtonPressed = false;
                Pointer.onLeftButtonRelease(e);
            }
        }, false);

        document.addEventListener('contextmenu', e => e?.cancelable && e.preventDefault());
    }

    static recalcMousePosition(e) {
        const rect = Board.ctx.canvas.getBoundingClientRect();
        const old = {
            positionWindow: {...Pointer.positionWindow},
            positionClient: {...Pointer.positionClient},
            positionServer: {...Pointer.positionServer},
        };

        Pointer.positionWindow = {
            x: e.clientX,
            y: e.clientY
        };

        Pointer.positionCanvas = {
            x: ((e.clientX - rect.left) / (rect.right - rect.left) * Board.ctx.canvas.width),
            y: ((e.clientY - rect.top) / (rect.bottom - rect.top) * Board.ctx.canvas.height),
        };

        Pointer.positionClient = {
            x: Math.floor((Pointer.positionCanvas.x + $hero.offset.x) / TILE_SIZE),
            y: Math.floor((Pointer.positionCanvas.y + $hero.offset.y) / TILE_SIZE),
        };

        if (!isSamePosition(Pointer.positionClient, old.positionClient) || !isSamePosition(Pointer.positionServer, old.positionServer)) {
            Pointer.updateCursorAndServerPosition();
        } else {
            Pointer.positionServer = Board.positionClientToServer(Pointer.positionClient);
        }
    }

    static updateCursorAndServerPosition() {
        Pointer.positionServer = Board.positionClientToServer(Pointer.positionClient);
        if (Pointer.grabbing.itemId) {
            return;
        }

        const item = Board.getTileTopItem(Pointer.positionServer);
        if (item.id === 6) {
            Pointer.setCursor('chest');
        } else if (item.id === 8) {
            Pointer.setCursor('pick');
        } else {
            Pointer.setCursor('default');
        }
    }

    static onLeftButtonPress(e) {

    }

    static onLeftButtonRelease(e) {

        // release grab
        if (Pointer.grabbing.itemId) {
            if (e.target.id === "board") {
                Pointer.releaseItemOnFloor({...Pointer.positionServer});
            } else if (e.target.classList && e.target.classList.contains('slot')) {
                Pointer.releaseItemOnInventory(e.target.dataset.slotIndex);
            } else {
                Pointer.cleanGrab();
                Pointer.updateCursorAndServerPosition();
            }
            return;
        }

        Pointer.cleanGrab();
        if (e.target.classList && e.target.classList.contains('slot')) {
            const slot = e.target.dataset.slotIndex;
            const item = $inventory.getSlot(slot).item;
            if (!item) return;
            if (!item.isUsable()) return;
            WebsocketRequest.use(item.id, null, slot);
            return;
        }

        if (e.target.id !== "board") return;

        const position = {...Pointer.positionServer};
        const itemId = Board.getTileTopItem(position)?.id;
        if (!itemId) return;
        const item = ItemStructure.get(itemId);
        if (!item) return;

        if (item.isUsable) {
            Pointer.runEffect('pointer-cross-red');
            if (isPositionInRange($hero.position, position)) {
                WebsocketRequest.use(itemId, position);
            } else {
                Movement.setPath(Pointer.positionServer, 'use', {
                    itemId: item.id
                });
            }
            return;
        }

        if (!item.isUsable) {
            Pointer.runEffect('pointer-cross-yellow');
            Movement.setPath(Pointer.positionServer, 'walk');
        }
    }

    static grabItemFromFloor(source) {
        const itemId = Board.getTileTopItem(source)?.id;
        if (!itemId) return;
        if (!ItemStructure.get(itemId).isMovable) return;
        Pointer.grabbing.itemId = itemId;
        Pointer.grabbing.source = source;
        Pointer.setCursor('crosshair');
    }

    static grabItemFromInventory(slot) {
        const item = $inventory.getSlot(slot).item;
        if (!item) return;
        Pointer.grabbing.itemId = item.id;
        Pointer.grabbing.source = slot;
        Pointer.setCursor('crosshair');
    }

    static releaseItemOnFloor(target) {
        const item = ItemStructure.get(Pointer.grabbing.itemId);
        if (isPosition(Pointer.grabbing.source)) {
            const positionFrom = {...Pointer.grabbing.source};
            Pointer.cleanGrab();
            Pointer.updateCursorAndServerPosition();

            if (isSamePosition(positionFrom, target)) {
                return;
            }
            if (isPositionInRange($hero.position, positionFrom)) {
                WebsocketRequest.moveItem(positionFrom, target, item.id);
            } else {
                Movement.setPath(positionFrom, 'move', {
                    itemId: item.id,
                    positionFrom: positionFrom,
                    positionTo: target,
                })
            }
        } else {
            const slot = Pointer.grabbing.source;
            Pointer.cleanGrab();
            Pointer.updateCursorAndServerPosition();
            WebsocketRequest.drop(item.id, slot, target);
        }
    }

    static releaseItemOnInventory(target) {
        const item = ItemStructure.get(Pointer.grabbing.itemId);
        if (isPosition(Pointer.grabbing.source)) {
            const positionFrom = {...Pointer.grabbing.source};
            Pointer.cleanGrab();
            Pointer.updateCursorAndServerPosition();
            if (!item.isPickupable) {
                return;
            }
            if (isPositionInRange($hero.position, positionFrom)) {
                WebsocketRequest.pickUp(item.id, positionFrom, target);
            } else {
                Movement.setPath(positionFrom, 'pick-up', {
                    itemId: item.id,
                    positionFrom: positionFrom,
                    slot: target,
                })
            }
        } else {
            const source = Pointer.grabbing.source;
            Pointer.cleanGrab();
            Pointer.updateCursorAndServerPosition();
            WebsocketRequest.rearrangeItem(item.id, source, target);
        }
    }

    static cleanGrab() {
        Pointer.grabbing.itemId = null;
        Pointer.grabbing.source = null;
    }

    static runEffect(name) {
        const effectSprite = Sprite.get(name).clone();
        const effect = {
            sprite: effectSprite,
            position: {...Pointer.positionCanvas},
        }
        effectSprite.play().then(() => {
            if (Pointer.effect === effect) {
                Pointer.effect = null
            }
        });
        Pointer.effect = effect;
    }

    static setCursor(name) {
        if (name === 'default') {
            $app.removeAttribute('cursor');
        } else {
            $app.setAttribute('cursor', name);
        }
    }
}
