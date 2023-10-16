import {isPositionInRange, isSamePosition} from "../utils/position.js";
import Board from "./Board.js";
import {$hero} from "../utils/globals.js";
import Connector from "./ConnectorMock.js";

export default class WebsocketRequest {

    static pickUp(itemId, position, slot) {
        const item = Board.getTileTopItem(position);
        if (itemId !== item.id) return false;
        if (!isPositionInRange($hero.position, position)) return false;

        Connector.emit('pick-up', {
            itemId: item.id,
            quantity: item.quantity,
            position: position,
            slot: slot,
        })
    }

    static drop(itemId, slot, position) {
        Connector.emit('drop', {
            itemId: itemId,
            slot: slot,
            position: position,
        })
    }

    static moveItem(positionFrom, positionTo, itemId) {
        const item = Board.getTileTopItem(positionFrom);
        if (isSamePosition(positionFrom, positionTo)) return false;
        if (itemId !== item.id) return false;
        if (Board.getTileStack(positionTo).find((item) => item.isBlockingItems())) return false;
        if (!isPositionInRange($hero.position, positionFrom)) return false;

        Connector.emit('move-item', {
            itemId: item.id,
            quantity: item.quantity,
            from: positionFrom,
            to: positionTo,
        })
    }

    static rearrangeItem(itemId, slotFrom, slotTo) {
        if (slotFrom === slotTo) return;

        Connector.emit('rearrange-item', {
            itemId: itemId,
            slotFrom: slotFrom,
            slotTo: slotTo,
        })
    }

    static use(itemId, position = null, slot = null) {
        if (position) {
            if (Board.getTileTopItem(position)?.id !== itemId) return false;
            if (!isPositionInRange($hero.position, position)) return false;
        }

        Connector.emit('use', {
            itemId: itemId,
            position: position,
            slot: slot,
        })
    }

    static requestTiles(positions) {
        Connector.emit('request-tiles', {
            positions: positions,
        })
    }

}
