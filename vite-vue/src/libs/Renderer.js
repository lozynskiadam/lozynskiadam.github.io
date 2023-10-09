import {TILE_SIZE} from "../config.js";
import {isSamePosition} from "../utils/position.js";
import Item from "./Item.js";
import Pointer from "./Pointer.js";
import Sprite from "./Sprite.js";
import Board from "./Board.js";
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
                    altitude += item.altitude;
                }
            });

            Object.values(Board.creatures).forEach((creature) => {
                if (isSamePosition(positionServer, creature.position)) {
                    Renderer.drawCreature(positionClient, creature, altitude);
                    Renderer.drawNickname(positionClient, creature, altitude);
                    Renderer.drawHealthBar(positionClient, creature, altitude);
                }
            });

            Board.getVisibleEffectsSprites(positionServer).forEach((sprite) => {
                if (sprite.customData.onCreature ?? false) {
                    Renderer.drawSprite(positionClient, sprite, altitude + Math.ceil(TILE_SIZE / 8));
                } else {
                    Renderer.drawSprite(positionClient, sprite, altitude);
                }
            });
        }
    }

    static drawSprite(position, sprite, altitude = 0) {
        const image = sprite.getFrame();
        const top = (position.y * TILE_SIZE) + (TILE_SIZE - image.height) - altitude;
        const left = (position.x * TILE_SIZE) + (Math.ceil(TILE_SIZE / 2) - Math.ceil(image.width / 2));
        Board.tempCtx.drawImage(image, left, top);
    }

    static drawCreature(position, creature, altitude = 0) {
        const image = creature.sprite.getFrame();
        const top = (position.y * TILE_SIZE) + (TILE_SIZE - image.height) - Math.ceil(TILE_SIZE / 8) + creature.offset.y - altitude;
        const left = (position.x * TILE_SIZE) + (Math.ceil(TILE_SIZE / 2) - Math.ceil(image.width / 2)) + creature.offset.x;
        Board.tempCtx.drawImage(image, left, top);
    }

    static drawNickname(position, creature, altitude = 0) {
        let top = (position.y * TILE_SIZE) - altitude;
        let left = position.x * TILE_SIZE;
        if (!creature.isHero()) {
            left = left - ($hero.offset.x - creature.offset.x);
            top = top - ($hero.offset.y - creature.offset.y);
        }
        top *= Board.scale;
        left *= Board.scale;

        Board.hudCtx.fillStyle = "#ffffff";
        Board.hudCtx.strokeStyle = "#000000";
        Board.hudCtx.font = "16px Hind Vadodara";
        Board.hudCtx.lineWidth = 2;

        top = top - (26 * Board.scale);
        left = left + ((TILE_SIZE * Board.scale) / 2) - Math.ceil(Board.hudCtx.measureText(creature.name).width / 2);
        Board.hudCtx.strokeText(creature.name, left, top);
        Board.hudCtx.fillText(creature.name, left, top);
    }

    static drawHealthBar(position, creature, altitude = 0) {
        const image = Sprite.get('hp-bar').getFrame();
        let top = (position.y * TILE_SIZE) - altitude;
        let left = position.x * TILE_SIZE;
        if (!creature.isHero()) {
            left = left - ($hero.offset.x - creature.offset.x);
            top = top - ($hero.offset.y - creature.offset.y);
        }
        top *= Board.scale;
        left *= Board.scale;

        top = top - (23 * Board.scale);
        left = left + ((TILE_SIZE * Board.scale) / 2) - Math.ceil(image.width / 2);
        Board.hudCtx.fillStyle = "#000000";
        Board.hudCtx.globalAlpha = 0.5;
        Board.hudCtx.fillRect(left-1, top-1, image.width+2, image.height+2);
        Board.hudCtx.globalAlpha = 1;
        Board.hudCtx.drawImage(image, left, top, Math.ceil(image.width * creature.healthPercent / 100), image.height);
    }

    static render() {
        Board.tempCtx.fillRect(0, 0, Board.tempCtx.canvas.width, Board.tempCtx.canvas.height);
        Board.hudCtx.clearRect(0, 0, Board.hudCtx.canvas.width, Board.hudCtx.canvas.height);

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
        Renderer.renderTexts();
        Renderer.renderPointerEffect();
        Board.ctx.drawImage(Board.tempCtx.canvas, -$hero.offset.x, -$hero.offset.y);

        window.requestAnimationFrame(Renderer.render);
    }

    static renderTexts() {
        Board.hudCtx.font = "bold 18px Hind Vadodara";
        Board.hudCtx.lineWidth = 2;

        for (let text of Object.values(Board.texts)) {
            const position = Board.positionServerToClient(text.position);
            Board.hudCtx.fillStyle = text.color;
            const top = ((position.y * TILE_SIZE - $hero.offset.y) * Board.scale) + text.offset.y;
            let left = ((position.x * TILE_SIZE - $hero.offset.x) * Board.scale) + text.offset.x;
            left = left + ((TILE_SIZE * Board.scale) / 2) - Math.ceil(Board.hudCtx.measureText(text.content).width / 2);
            Board.hudCtx.strokeText(text.content, left, top);
            Board.hudCtx.fillText(text.content, left, top);
        }
    }

    static renderPointerEffect() {
        if (!Pointer.effect) return;

        const image = Pointer.effect.sprite.getFrame();
        const position = Pointer.effect.position;
        const offset = $hero.offset;
        Board.tempCtx.drawImage(image, position.x + offset.x - (image.width / 2), position.y + offset.y - (image.height / 2));
    }
}
