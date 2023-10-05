import Board from "./Board.js";
import {$hero} from "../utils/globals.js";
import Pointer from "./Pointer.js";
import {randomString, roll} from "../utils/common.js";
import {isSamePosition} from "../utils/position.js";

export default class Connector {

    static async connect(token) {
        return new Promise((resolve) => resolve());
    }

    static emit(event, params) {
        if (event === 'move-item') {
            return Connector.#moveItem(params);
        }
        if (event === 'pick-up') {
            return Connector.#pickUp(params);
        }
        if (event === 'use') {
            return Connector.#use(params);
        }
        if (event === 'request-tiles') {
            return Connector.#requestTiles(params);
        }
    }

    static #moveItem(params) {
        const stackFrom = Board.getTileStack(params.from);
        stackFrom.pop();
        const stackTo = Board.getTileStack(params.to);
        stackTo.push(params.itemId);

        window.dispatchEvent(new CustomEvent('update-tile', {detail: {position: params.from, stack: stackFrom}}));
        window.dispatchEvent(new CustomEvent('update-tile', {detail: {position: params.to, stack: stackTo}}));
    }

    static #pickUp(params) {
        const stack = Board.getTileStack(params.position);
        stack.pop();
        window.dispatchEvent(new CustomEvent('update-inventory-slot', {
            detail: {slot: params.slot, itemId: params.itemId, quantity: 1}
        }));
    }

    static #use(params) {
        if (params.itemId === 6) {
            const stack = Board.getTileStack(params.position);
            stack.pop();
            stack.push(9);
            window.dispatchEvent(new CustomEvent('update-tile', {detail: {position: params.position, stack: stack}}));
            window.dispatchEvent(new CustomEvent('run-effect', {detail: {position: params.position, effect: 'ore-hit'}}));
        }

        if (params.itemId === 8) {
            const stack = Board.getTileStack(params.position);
            window.dispatchEvent(new CustomEvent('update-tile', {detail: {position: params.position, stack: stack}}));
            window.dispatchEvent(new CustomEvent('run-effect', {detail: {position: params.position, effect: 'ore-hit'}}));
            window.dispatchEvent(new CustomEvent('update-inventory-slot', {
                detail: {
                    slot: 0,
                    itemId: 10,
                    quantity: 1
                }
            }));
        }

        if (params.itemId === 9) {
            window.dispatchEvent(new CustomEvent('run-effect', {
                detail: {
                    position: $hero.position,
                    effect: 'yellow-sparkles'
                }
            }));
        }

        Pointer.updateCursorAndServerPosition();
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
                }
            }

            window.dispatchEvent(new CustomEvent('update-tile', {detail: {position: position, stack: stack}}));

            if (roll(350)) {
                window.dispatchEvent(new CustomEvent('add-creature', {
                    detail: {
                        position: position,
                        name: 'NPC #' + randomString(4)
                    }
                }));
            }
        }
    }

}
