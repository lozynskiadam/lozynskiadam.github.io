import {TILE_SIZE} from "../config.js";
import Effect from "./Effect.js";
import Board from "./Board.js";
import Creature from "./Creature.js";
import Movement from "./Movement.js";

export default class Hero {

    static creature = null;

    static movement = {
        queuedMove: null,
        isMoving: false,
        currentFrame: 0,
        timeouts: []
    };

    static init() {
        Hero.creature = new Creature('Nemnes', {x: 100, y: 100}, {x: 0, y: 0});
        Effect.get('energy').run(Hero.creature.position.x, Hero.creature.position.y);
    }

    static walk(direction) {
        if (Hero.movement.isMoving) {
            if (Hero.movement.currentFrame > (TILE_SIZE - (TILE_SIZE/3))) {
                Hero.movement.queuedMove = direction;
                return true;
            }
            return false;
        }

        const targetPosition = Movement.getTargetPosition(Hero.creature, direction);
        if (!Board.isWalkable(targetPosition.x, targetPosition.y)) {
            Hero.creature.sprite.loop('idle-' + direction);
            return false;
        }

        Hero.movement.isMoving = true;
        for (let i = 0; i < TILE_SIZE; i++) {
            const timeout = setTimeout(() => Hero.handleWalkFrame(direction, targetPosition), (1000 / Hero.creature.speed / TILE_SIZE) * i);
            Hero.movement.timeouts.push(timeout);
        }

        return true;
    }

    static handleWalkFrame(direction, targetPosition) {
        Hero.creature.sprite.loop('walk-' + direction);
        Hero.movement.currentFrame++;
        Movement.updateOffsetAfterAnimationFrameChange(Hero.creature, direction);
        if (Hero.movement.currentFrame === (TILE_SIZE / 2)) {
            Hero.creature.position = targetPosition;
            window.dispatchEvent(new CustomEvent("hero-position-changed"));
            Movement.updateOffsetAfterPositionChange(Hero.creature, direction);
        }
        if (Hero.movement.currentFrame === TILE_SIZE) {
            Hero.movement.isMoving = false;
            Hero.movement.currentFrame = 0;
            Hero.movement.timeouts.forEach((timeout) => clearTimeout(timeout));
            Hero.movement.timeouts = [];
            if (Hero.movement.queuedMove) {
                direction = Hero.movement.queuedMove;
                Hero.movement.queuedMove = null;
                if (!Hero.walk(direction)) {
                    Hero.creature.sprite.loop('idle-' + direction);
                }
            } else {
                Hero.creature.sprite.loop('idle-' + direction);
            }
        }
    }
}
