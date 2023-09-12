import {TILE_SIZE} from "../config.js";
import Hero from "./Hero.js";

export default class Movement {

    static init() {
        window.addEventListener("move-north", () => Hero.walk('north'));
        window.addEventListener("move-south", () => Hero.walk('south'));
        window.addEventListener("move-west", () => Hero.walk('west'));
        window.addEventListener("move-east", () => Hero.walk('east'));
    }

    static move(creature, position, direction) {
        creature.movement.timeouts.forEach((timeout) => clearTimeout(timeout));
        creature.movement.timeouts = [];
        creature.currentFrame = 0;
        creature.offset = {x: 0, y: 0};
        creature.movement.isMoving = true;
        for (let i = 0; i < TILE_SIZE; i++) {
            const timeout = setTimeout(() => Movement.handleMovingFrame(creature, position, direction), (1000 / creature.speed / TILE_SIZE) * i);
            creature.movement.timeouts.push(timeout);
        }
    }

    static handleMovingFrame(creature, position, direction) {
        creature.sprite.loop('walk-' + direction);
        creature.movement.currentFrame++;
        Movement.updateOffsetAfterAnimationFrameChange(creature, direction);
        if (creature.movement.currentFrame === (TILE_SIZE / 2)) {
            creature.position = position;
            window.dispatchEvent(new CustomEvent("hero-position-changed"));
            Movement.updateOffsetAfterPositionChange(creature, direction);
        }
        if (creature.movement.currentFrame === TILE_SIZE) {
            creature.movement.isMoving = false;
            creature.movement.currentFrame = 0;
            creature.movement.timeouts.forEach((timeout) => clearTimeout(timeout));
            creature.movement.timeouts = [];
            if (creature.isHero() && Hero.queuedMove) {
                direction = Hero.queuedMove;
                Hero.queuedMove = null;
                if (Hero.walk(direction)) return;
            }
            creature.sprite.loop('idle-' + direction);
        }
    }

    static getTargetPosition(creature, direction) {
        const map = {
            'north': { x: 0, y: -1 },
            'south': { x: 0, y: 1 },
            'west': { x: -1, y: 0 },
            'east': { x: 1, y: 0 }
        };

        return {
            x: creature.position.x + map[direction].x,
            y: creature.position.y + map[direction].y
        };
    }

    static updateOffsetAfterAnimationFrameChange(creature, direction) {
        const map = {
            'north': () => creature.offset.y--,
            'south': () => creature.offset.y++,
            'west': () => creature.offset.x--,
            'east': () => creature.offset.x++
        }
        map[direction]();
    }

    static updateOffsetAfterPositionChange(creature, direction) {
        const map = {
            'north': () => creature.offset.y = (TILE_SIZE / 2),
            'south': () => creature.offset.y = -(TILE_SIZE / 2),
            'west': () => creature.offset.x = (TILE_SIZE / 2),
            'east': () => creature.offset.x = -(TILE_SIZE / 2)
        }
        map[direction]();
    }

}
