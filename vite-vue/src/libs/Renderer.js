import {TILE_SIZE} from "../config.js";
import {isSamePosition} from "../utils/position.js";
import Item from "./Item.js";
import Mouse from "./Mouse.js";
import Sprite from "./Sprite.js";
import Board from "./Board.js";
import Keyboard from "./Keyboard.js";
import {$hero} from "../utils/globals.js";

export default class Renderer {

    static renderTile(positionClient, positionServer, layer, tile) {
        if (layer === 'ground') {
            tile.forEach((itemId) => {
                if (Item.get(itemId).type === 'ground') {
                    Renderer.drawSprite(positionClient, Item.get(itemId).sprite);
                }
            });
        }

        if (layer === 'objects') {
            let altitude = 0;

            tile.forEach((itemId) => {
                const item = Item.get(itemId);
                if (item.type === 'object') {
                    Renderer.drawSprite(positionClient, item.sprite, altitude);
                }
                altitude += item.altitude;
            });

            if (Keyboard.shift.isPressed && isSamePosition(positionClient, Mouse.positionClient)) {
                Renderer.drawSprite(positionClient, Sprite.get('cursor'));
            }

            Object.values(Board.creatures).forEach((creature) => {
                if (isSamePosition(positionServer, creature.position)) {
                    Renderer.drawCreature(positionClient, creature, altitude);
                }
            });

            Board.getVisibleEffectsSprites(positionServer).forEach((sprite) => {
                Renderer.drawSprite(positionClient, sprite, altitude);
            });
        }
    }

    static drawSprite(position, sprite, altitude = 0) {
        const image = sprite.getFrame();
        const top = (position.y * TILE_SIZE) + (TILE_SIZE - image.height) - altitude;
        const left = (position.x * TILE_SIZE) + (Math.ceil(TILE_SIZE / 2) - Math.ceil(image.width / 2));
        Renderer.tempCtx.drawImage(image, left, top);
    }

    static drawCreature(position, creature, altitude = 0) {
        const image = creature.sprite.getFrame();
        const top = (position.y * TILE_SIZE) + (TILE_SIZE - image.height) - Math.ceil(TILE_SIZE / 8) + creature.offset.y - altitude;
        const left = (position.x * TILE_SIZE) + (Math.ceil(TILE_SIZE / 2) - Math.ceil(image.width / 2)) + creature.offset.x;
        Renderer.tempCtx.drawImage(image, left, top);
    }

    static cropEdges(ctx) {
        ctx.clearRect(0, 0, TILE_SIZE, ctx.canvas.height);
        ctx.clearRect(0, 0, ctx.canvas.width, TILE_SIZE);
        ctx.clearRect(ctx.canvas.width - TILE_SIZE, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.clearRect(0, ctx.canvas.height - TILE_SIZE, ctx.canvas.width, ctx.canvas.height);
    }

    static render() {
        const canvas = document.createElement('canvas');
        canvas.width = Board.ctx.canvas.width;
        canvas.height = Board.ctx.canvas.height;
        Renderer.tempCtx = canvas.getContext('2d');
        Renderer.tempCtx.fillStyle = '#25131a';
        Renderer.tempCtx.fillRect(0, 0, Renderer.tempCtx.canvas.width, Renderer.tempCtx.canvas.height);
        for (let layer of ['ground', 'objects']) {
            let y = 0;
            for (let [sy, row] of Object.entries(Board.tiles)) {
                let x = 0;
                for (let [sx, tile] of Object.entries(row)) {
                    const positionClient = {x: x, y: y};
                    const positionServer = {x: Number(sx), y: Number(sy)};
                    Renderer.renderTile(positionClient, positionServer, layer, tile);
                    x++;
                }
                y++;
            }
        }
        Renderer.renderPointerEffect(Renderer.tempCtx);
        Board.ctx.clearRect(0, 0, Board.ctx.canvas.width, Board.ctx.canvas.height);
        Board.ctx.drawImage(canvas, -$hero.offset.x, -$hero.offset.y);
        Renderer.cropEdges(Board.ctx);

        window.requestAnimationFrame(Renderer.render);
    }

    static renderPointerEffect(ctx) {
        if (!Mouse.effect) return;

        const image = Mouse.effect.sprite.getFrame();
        const position = Mouse.effect.position;
        const offset = $hero.offset;
        ctx.drawImage(image, position.x + offset.x - (image.width / 2), position.y + offset.y - (image.height / 2));
    }
}
