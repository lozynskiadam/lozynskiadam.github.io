import Board from "./Board.js";
import Effect from "./Effect.js";
import {TILE_SIZE} from "../config.js";
import Hero from "./Hero.js";

export default class Mouse {

    static position = {
        x: null,
        y: null,
        clientX: null,
        clientY: null,
        serverX: null,
        serverY: null,
    }

    static buttons = {
        left: {
            isBlocked: false,
            isDown: false,
        },
        right: {
            isBlocked: false,
            isDown: false,
        },
    }

    static init() {
        document.addEventListener('mousemove', Mouse.onMove, false);
        document.addEventListener('mousedown', (e) => {
            if (e.which === 1 || e.button === 0) {
                Mouse.buttons.left.isDown = true;
                Mouse.onLeftButtonClick();
            }
            if (e.which === 3 || e.button === 2) {
                Mouse.buttons.right.isDown = true;
                Mouse.onRightButtonClick();
            }
        });
        document.addEventListener('mouseup', (e) => {
            if (e.which === 1 || e.button === 0) {
                Mouse.buttons.left.isDown = false;
            }
            if (e.which === 3 || e.button === 2) {
                Mouse.buttons.right.isDown = false;
            }
        });
        document.addEventListener('contextmenu', e => e?.cancelable && e.preventDefault());
    }

    static onMove(e) {
        const rect = Board.ctx.canvas.getBoundingClientRect();
        const oldPosition = {...Mouse.position};

        Mouse.position.clientX = e.clientX;
        Mouse.position.clientY = e.clientY;
        Mouse.position.x = Math.floor((((e.clientX - rect.left) / (rect.right - rect.left) * Board.ctx.canvas.width) + Hero.offset.x) / TILE_SIZE);
        Mouse.position.y = Math.floor((((e.clientY - rect.top) / (rect.bottom - rect.top) * Board.ctx.canvas.height) + Hero.offset.y) / TILE_SIZE);

        const serverPosition = Board.positionLocalToServer(Mouse.position.x, Mouse.position.y)
        Mouse.position.serverX = serverPosition.x;
        Mouse.position.serverY = serverPosition.y;

        if (Mouse.position.x !== oldPosition.x || Mouse.position.y !== oldPosition.y) {
            Mouse.onPositionChange(oldPosition);
        }
        if (Mouse.position.serverX !== oldPosition.serverX || Mouse.position.serverY !== oldPosition.serverY) {
            Mouse.onPositionChange(oldPosition);
        }
    }

    static onPositionChange() {
        const position = Board.positionLocalToServer(Mouse.position.x, Mouse.position.y);
        const itemId = Board.getTileTopItem(position.x, position.y);
        if (!itemId) {
            Board.ctx.canvas.removeAttribute('cursor');
            return;
        }

        if (itemId === 6) {
            Board.ctx.canvas.setAttribute('cursor', 'chest');
        } else if (itemId === 8) {
            Board.ctx.canvas.setAttribute('cursor', 'pick');
        } else {
            Board.ctx.canvas.removeAttribute('cursor');
        }
    }

    static onLeftButtonClick() {
        if (Mouse.buttons.left.isBlocked) return;

        const position = Board.positionLocalToServer(Mouse.position.x, Mouse.position.y);
        const itemId = Board.getTileTopItem(position.x, position.y);
        if (!itemId) {
            return;
        }

        if (itemId === 6) {
            Mouse.buttons.left.isBlocked = true;
            Effect.get('yellow-sparkles').run(position.x, position.y);
            Board.tiles[position.y][position.x].pop();
            setTimeout(() => {
                Mouse.buttons.left.isBlocked = false;
            }, 600);
            return;
        }

        if (itemId === 8) {
            Mouse.buttons.left.isBlocked = true;
            Effect.get('ore-hit').run(position.x, position.y);
            setTimeout(() => {
                Mouse.buttons.left.isBlocked = false;
            }, 600);
            return;
        }
    }

    static onRightButtonClick() {
    }
}
