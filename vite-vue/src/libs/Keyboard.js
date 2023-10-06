import {bindKey, checkKey} from "@rwh/keystrokes";
import Pointer from "./Pointer.js";
import Item from "./Item.js";
import Movement from "./Movement.js";
import Board from "./Board.js";
import {emit} from "../utils/common.js";

export default class Keyboard {

    static shift = {
        isPressed: false
    };

    static init() {
        document.addEventListener("keydown", () => setTimeout(Keyboard.triggerKeyHoldingFunctions));
        window.keyboardLoop = setInterval(Keyboard.triggerKeyHoldingFunctions, 200);
        bindKey('shift', {
            onPressed: () => {
                Keyboard.shift.isPressed = true;
                Pointer.updateCursorAndServerPosition();
            },
            onReleased: () => {
                Keyboard.shift.isPressed = false;
                Pointer.updateCursorAndServerPosition();
            },
        });
        bindKey('i', () => {
            emit('inventory-toggle');
        });
    }

    static triggerKeyHoldingFunctions = () => {
        if (checkKey('ArrowUp') || checkKey('w')) {
            emit('move-north');
        }
        if (checkKey('ArrowDown') || checkKey('s')) {
            emit('move-south');
        }
        if (checkKey('ArrowLeft') || checkKey('a')) {
            emit('move-west');
        }
        if (checkKey('ArrowRight') || checkKey('d')) {
            emit('move-east');
        }
    }

}
