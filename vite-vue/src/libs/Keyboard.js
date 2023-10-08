import {bindKey, checkKey} from "@rwh/keystrokes";
import {emit} from "../utils/common.js";

export default class Keyboard {

    static init() {
        document.addEventListener("keydown", () => setTimeout(Keyboard.triggerKeyHoldingFunctions));
        window.keyboardLoop = setInterval(Keyboard.triggerKeyHoldingFunctions, 200);
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
