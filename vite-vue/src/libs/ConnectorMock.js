import Board from "./Board.js";
import {$hero, $inventory, $vitality} from "../utils/globals.js";
import Pointer from "./Pointer.js";
import {emit, randomString, roll} from "../utils/common.js";
import {isSamePosition} from "../utils/position.js";

export default class Connector {

    static async connect(token) {
        return new Promise((resolve) => {
            window.addEventListener("hero-position-changed", Connector.#onPositionChange);
            window.addEventListener("update-vitals", (event) => {
                if (event.detail?.health === 0) emit('dead');
            });
            return resolve();
        });
    }

    static emit(event, params) {
        if (event === 'use') return Connector.#use(params);
        if (event === 'move-item') return Connector.#moveItem(params);
        if (event === 'pick-up') return Connector.#pickUp(params);
        if (event === 'drop') return Connector.#drop(params);
        if (event === 'request-tiles') return Connector.#requestTiles(params);
    }

    static #use(params) {
        if (params.itemId === 6) {
            const stack = Board.getTileStack(params.position);
            stack.pop();
            stack.push(roll(2) ? 9 : 11);
            emit('update-tile', {position: params.position, stack: stack});
            emit('run-effect', {position: params.position, effect: 'yellow-sparkles'});
        }

        if (params.itemId === 8) {
            emit('run-effect', {position: params.position, effect: 'ore-hit'});

            let quantity = 1;
            if ($inventory.getSlot(0).item?.id === 10) {
                quantity = $inventory.getSlot(0).quantity + 1;
            }
            emit('loot', {itemId: 10, quantity: 1});
            emit('update-inventory-slot', {slot: 0, itemId: 10, quantity: quantity});
        }

        if (params.itemId === 9) {
            let health = $vitality.health + 10;
            if (health > $vitality.maxHealth) health = $vitality.maxHealth;
            emit('update-vitals', {health: health});
            emit('run-effect', {position: $hero.position, effect: 'red-sparkles'})
        }

        if (params.itemId === 11) {
            let mana = $vitality.mana + 10;
            if (mana > $vitality.maxMana) mana = $vitality.maxMana;
            emit('update-vitals', {mana: mana});
            emit('run-effect', {position: $hero.position, effect: 'blue-sparkles'})
        }

        Pointer.updateCursorAndServerPosition();
    }

    static #moveItem(params) {
        const stackFrom = Board.getTileStack(params.from);
        stackFrom.pop();
        const stackTo = Board.getTileStack(params.to);
        stackTo.push(params.itemId);
        emit('update-tile', {position: params.from, stack: stackFrom});
        emit('update-tile', {position: params.to, stack: stackTo});
    }

    static #pickUp(params) {
        const stack = Board.getTileStack(params.position);
        stack.pop();
        emit('update-inventory-slot', {slot: params.slot, itemId: params.itemId, quantity: 1});
    }

    static #drop(params) {
        const itemId = $inventory.getSlot(params.slot).item.id;
        const stack = Board.getTileStack(params.position);
        stack.push(itemId);
        emit('update-tile', {position: params.position, stack: stack});
        emit('update-inventory-slot', {slot: params.slot, itemId: null});
    }

    static #requestTiles(params) {
        for (const position of params.positions) {
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

            if (!isSamePosition(position, $hero.position)) {
                if (roll(100)) {
                    stack.push(6);
                } else if (roll(100)) {
                    stack.push(8);
                } else if (roll(100)) {
                    stack.push(5);
                } else if (roll(100)) {
                    stack.push(7);
                } else if (roll(100)) {
                    stack.push(12);
                }
            }

            emit('update-tile', {position: position, stack: stack});
            if (roll(350)) {
                emit('add-creature', {position: position, name: 'NPC #' + randomString(4)});
            }
        }
    }

    static #onPositionChange() {
        const stack = Board.getTileStack($hero.position);
        stack.forEach((itemId, index) => {
            if (itemId === 12) {
                let health = $vitality.health - 15;
                if (health < 0) health = 0;
                stack[index] = 13;
                Board.update();
                emit('run-effect', {position: $hero.position, effect: 'blood', onCreature: true});
                emit('update-vitals', {health: health});
                setTimeout(() => {stack[index] = 12}, 1000);
            }
        });
    }

}
