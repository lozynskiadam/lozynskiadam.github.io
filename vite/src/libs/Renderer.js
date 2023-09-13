import {TILE_SIZE} from "../config.js";
import Item from "./Item.js";
import Mouse from "./Mouse.js";
import Sprite from "./Sprite.js";
import Hero from "./Hero.js";
import Board from "./Board.js";
import Keyboard from "./Keyboard.js";

export default class Renderer {

    static renderTile(x, y, sx, sy, layer, tile) {
        if (layer === 'ground') {
            tile.forEach((itemId) => {
                if (Item.get(itemId).type === 'ground') {
                    Renderer.drawSprite(Item.get(itemId).sprite.getFrame(), x, y);
                }
            });
        }

        if (layer === 'objects') {
            if (Keyboard.shift.isPressed && Mouse.positionClient.x === x && Mouse.positionClient.y === y) {
                Renderer.drawSprite(Sprite.get('cursor').getFrame(), x, y)
            }

            tile.forEach((itemId) => {
                const item = Item.get(itemId);
                if (item.type === 'object') {
                    Renderer.drawSprite(item.sprite.getFrame(), x, y)
                }
            });

            Object.values(Board.creatures).forEach((creature) => {
                if (sx === creature.position.x && sy === creature.position.y) {
                    Renderer.drawCreature(creature, x, y)
                }
            });

            Board.getEffects(sx, sy).forEach((effect) => {
                Renderer.drawSprite(effect.getFrame(), x, y)
            });
        }
    }

    static drawSprite(image, x, y) {
        let top = (y * TILE_SIZE) + (TILE_SIZE - image.height);
        let left = (x * TILE_SIZE) + (Math.ceil(TILE_SIZE / 2) - Math.ceil(image.width / 2));
        Renderer.tempCtx.drawImage(image, left, top);
    }

    static drawCreature(creature, x, y) {
        let image = creature.sprite.getFrame();
        let top = (y * TILE_SIZE) + (TILE_SIZE - image.height) + creature.offset.y;
        let left = (x * TILE_SIZE) + (Math.ceil(TILE_SIZE / 2) - Math.ceil(image.width / 2)) + creature.offset.x;
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
                    Renderer.renderTile(x, y, Number(sx), Number(sy), layer, tile);
                    x++;
                }
                y++;
            }
        }
        Renderer.renderInfoBox(Renderer.tempCtx);
        Board.ctx.clearRect(0, 0, Board.ctx.canvas.width, Board.ctx.canvas.height);
        Board.ctx.drawImage(canvas, -Hero.creature.offset.x, -Hero.creature.offset.y);
        Renderer.cropEdges(Board.ctx);

        window.requestAnimationFrame(Renderer.render);
    }

    static renderInfoBox(ctx)
    {
        if (Keyboard.shift.isPressed) {

            const position = {
                x: Mouse.positionClient.x * TILE_SIZE + ((TILE_SIZE/3)*2),
                y: Mouse.positionClient.y * TILE_SIZE + ((TILE_SIZE/3)*2)
            }

            for (const [name, creature] of Object.entries(Board.creatures)) {
                if (Mouse.positionServer.x === creature.position.x && Mouse.positionServer.y === creature.position.y) {
                    const width = name.length * 5.5 + 8;
                    ctx.fillStyle = "#1c3d17";
                    ctx.fillRect(position.x, position.y, width, 16);
                    ctx.strokeStyle = "#FFA500";
                    ctx.strokeRect(position.x, position.y, width, 16);

                    ctx.font = "normal bold 9px monospace";
                    ctx.strokeStyle = "#000000";
                    ctx.strokeText(name, position.x + 4, position.y + 11);
                    ctx.strokeText(name, position.x + 4, position.y + 11);
                    ctx.fillStyle = "#FFA500";
                    ctx.fillText(name, position.x + 4, position.y + 11);

                    return;
                }
            }

            const itemId = Board.getTileTopItem(Mouse.positionServer);
            const item = Item.get(itemId);
            if (item && item.type === 'object') {
                const width = item.name.length * 5.5 + 8;

                ctx.fillStyle = "#172459";
                ctx.fillRect(position.x, position.y, width, 16);
                ctx.strokeStyle = "#FFA500";
                ctx.strokeRect(position.x, position.y, width, 16);

                ctx.font = "normal bold 9px monospace";
                ctx.strokeStyle = "#000000";
                ctx.strokeText(item.name, position.x + 4, position.y + 11);
                ctx.strokeText(item.name, position.x + 4, position.y + 11);
                ctx.fillStyle = "#FFA500";
                ctx.fillText(item.name, position.x + 4, position.y + 11);
            }
        }
    }

}