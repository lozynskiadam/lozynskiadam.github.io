import {isPositionInRange, isSamePosition} from "../utils/position.js";
import Board from "./Board.js";
import Item from "./Item.js";
import {$hero} from "../utils/globals.js";
import {randomString, roll} from "../utils/common.js";
import Connector from "./Connector.js";

export default class ServerEvent {

    static canMoveItem(positionFrom, positionTo, itemId) {
        if (isSamePosition(positionFrom, positionTo)) return false;
        if (itemId !== Board.getTileTopItem(positionFrom)) return false;
        if (Board.getTileStack(positionTo).find((itemId) => Item.get(itemId).isBlockingItems)) return false;
        if (!isPositionInRange($hero.position, positionFrom)) return false;

        return true;
    }

    static moveItem(positionFrom, positionTo, itemId) {
        if (!ServerEvent.canMoveItem(positionFrom, positionTo, itemId)) return;

        // Connector.emit('move-item', {
        //     itemId: itemId,
        //     from: positionFrom,
        //     to: positionTo,
        // })
        // \/ simulate response
        setTimeout(() => {
            const stackFrom = Board.getTileStack(positionFrom);
            stackFrom.pop();
            const stackTo = Board.getTileStack(positionTo);
            stackTo.push(itemId);

            window.dispatchEvent(new CustomEvent('update-tile', {detail: {position: positionFrom, stack: stackFrom}}));
            window.dispatchEvent(new CustomEvent('update-tile', {detail: {position: positionTo, stack: stackTo}}));
        }, 100);
    }

    static canUse(position, itemId) {
        if (Board.getTileTopItem(position) !== itemId) return false;
        if (!isPositionInRange($hero.position, position)) return false;

        return true;
    }

    static use(position, itemId) {
        if (!ServerEvent.canUse(position, itemId)) return;

        // Connector.emit('use', {
        //     itemId: itemId,
        //     position: position,
        // })
        // \/ simulate response
        setTimeout(() => {
            if (itemId === 6) {
                const stack = Board.getTileStack(position);
                stack.pop();
                stack.push(9);
                window.dispatchEvent(new CustomEvent('update-tile', {detail: {position: position, stack: stack}}));
                window.dispatchEvent(new CustomEvent('run-effect', {detail: {position: position, effect: 'ore-hit'}}));
            }

            if (itemId === 8) {
                const stack = Board.getTileStack(position);
                stack.push(10);
                window.dispatchEvent(new CustomEvent('update-tile', {detail: {position: position, stack: stack}}));
                window.dispatchEvent(new CustomEvent('run-effect', {detail: {position: position, effect: 'ore-hit'}}));
            }

            if (itemId === 9) {
                window.dispatchEvent(new CustomEvent('run-effect', {detail: {position: $hero.position, effect: 'yellow-sparkles'}}));
            }
        }, 100);
    }

    static requestTiles(positions) {
        // Connector.emit('request-tiles', {
        //     positions: positions,
        // })
        // \/ simulate response
        setTimeout(() => {
            for (const position of positions) {
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
                    window.dispatchEvent(new CustomEvent('add-creature', {detail: {position: position, name: randomString(20)}}));
                }
            }
        }, 200);
    }

}
