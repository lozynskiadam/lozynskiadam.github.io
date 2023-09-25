import {bindKey, checkKey} from "@rwh/keystrokes";
import Mouse from "./Mouse.js";

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
                Mouse.updateCursorAndServerPosition();
            },
            onReleased: () => {
                Keyboard.shift.isPressed = false;
                Mouse.updateCursorAndServerPosition();
            },
        })
    }

    static triggerKeyHoldingFunctions = () => {
        if (checkKey('ArrowUp') || checkKey('w')) {
            window.dispatchEvent(new CustomEvent("move-north"));
        }
        if (checkKey('ArrowDown') || checkKey('s')) {
            window.dispatchEvent(new CustomEvent("move-south"));
        }
        if (checkKey('ArrowLeft') || checkKey('a')) {
            window.dispatchEvent(new CustomEvent("move-west"));
        }
        if (checkKey('ArrowRight') || checkKey('d')) {
            window.dispatchEvent(new CustomEvent("move-east"));
        }
    }

}
