import {bindKey, checkKey} from "@rwh/keystrokes";

export default class Keyboard {

    static init() {
        document.addEventListener("keydown", () => setTimeout(Keyboard.triggerKeyHoldingFunctions));
        window.keyboardLoop = setInterval(Keyboard.triggerKeyHoldingFunctions, 200);
        bindKey(' ', () => window.dispatchEvent(new CustomEvent("randomize-outfit")));
        bindKey('Spacebar', () => window.dispatchEvent(new CustomEvent("randomize-outfit")));
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
