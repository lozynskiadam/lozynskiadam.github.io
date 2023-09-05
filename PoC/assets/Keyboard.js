class Keyboard {

    static init() {
        document.addEventListener("keydown", () => setTimeout(Keyboard.triggerKeyHoldingFunctions));
        window.keyboardLoop = setInterval(Keyboard.triggerKeyHoldingFunctions, 200);
        window.keystrokes.bindKey(' ', () => window.dispatchEvent(new CustomEvent("randomize-outfit")));
        window.keystrokes.bindKey('Spacebar', () => window.dispatchEvent(new CustomEvent("randomize-outfit")));
    }

    static triggerKeyHoldingFunctions = () => {
        if (window.keystrokes.checkKey('ArrowUp') || window.keystrokes.checkKey('w')) {
            window.dispatchEvent(new CustomEvent("move-north"));
        }
        if (window.keystrokes.checkKey('ArrowDown') || window.keystrokes.checkKey('s')) {
            window.dispatchEvent(new CustomEvent("move-south"));
        }
        if (window.keystrokes.checkKey('ArrowLeft') || window.keystrokes.checkKey('a')) {
            window.dispatchEvent(new CustomEvent("move-west"));
        }
        if (window.keystrokes.checkKey('ArrowRight') || window.keystrokes.checkKey('d')) {
            window.dispatchEvent(new CustomEvent("move-east"));
        }
    }

}
