import {TILE_SIZE} from "../config.js";
import Effect from "./Effect.js";
import Board from "./Board.js";
import Creature from "./Creature.js";
import Movement from "./Movement.js";

export default class Hero {

    static creature = null;

    static queuedMove = null;

    static init() {
        Hero.creature = new Creature('Nemnes', {x: 100, y: 100}, {x: 0, y: 0});
        Effect.get('energy').run(Hero.creature.position);
    }

    static walk(direction) {
        if (Hero.creature.movement.isMoving) {
            if (Hero.creature.movement.currentFrame > (TILE_SIZE - (TILE_SIZE/3))) {
                Hero.queuedMove = direction;
                return true;
            }
            return false;
        }

        const targetPosition = Movement.getTargetPosition(Hero.creature, direction);
        if (!Board.isWalkable(targetPosition)) {
            Hero.creature.sprite.loop('idle-' + direction);
            return false;
        }

        Movement.move(this.creature, targetPosition, direction);

        return true;
    }
}