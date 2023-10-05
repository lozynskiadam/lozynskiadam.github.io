import {isPositionInRange, isSamePosition} from "../utils/position.js";
import Board from "./Board.js";
import Item from "./Item.js";
import {$hero} from "../utils/globals.js";
import Connector from "./ConnectorMock.js";

export default class WebsocketRequest {

    static pickUp(itemId, position, slot) {
        if (itemId !== Board.getTileTopItem(position)) return false;
        if (!isPositionInRange($hero.position, position)) return false;

        Connector.emit('pick-up', {
            itemId: itemId,
            position: position,
            slot: slot,
        })
    }

    static moveItem(positionFrom, positionTo, itemId) {
        if (isSamePosition(positionFrom, positionTo)) return false;
        if (itemId !== Board.getTileTopItem(positionFrom)) return false;
        if (Board.getTileStack(positionTo).find((itemId) => Item.get(itemId).isBlockingItems)) return false;
        if (!isPositionInRange($hero.position, positionFrom)) return false;

        Connector.emit('move-item', {
            itemId: itemId,
            from: positionFrom,
            to: positionTo,
        })
    }

    static use(position, itemId) {
        if (Board.getTileTopItem(position) !== itemId) return false;
        if (!isPositionInRange($hero.position, position)) return false;

        Connector.emit('use', {
            itemId: itemId,
            position: position,
        })
    }

    static requestTiles(positions) {
        Connector.emit('request-tiles', {
            positions: positions,
        })
    }

}
