import {TILE_SIZE} from "../config.js";
import * as EasyStar from "easystarjs";
import {isPositionInRange, isSamePosition} from "../utils/position.js";
import Mouse from "./Mouse.js";
import {$board, $hero} from "../utils/globals.js";

export default class Movement {

    static queuedMove = null;

    static easyStar = null;

    static path = null;

    static init() {
        Movement.easyStar = new EasyStar.js()
        window.addEventListener("move-north", () => {
            Movement.clearPath();
            Movement.walk('north')
        });
        window.addEventListener("move-south", () => {
            Movement.clearPath();
            Movement.walk('south')
        });
        window.addEventListener("move-west", () => {
            Movement.clearPath();
            Movement.walk('west')
        });
        window.addEventListener("move-east", () => {
            Movement.clearPath();
            Movement.walk('east')
        });
    }

    static walk(direction) {
        if ($hero.movement.isMoving) {
            if ($hero.movement.currentFrame > (TILE_SIZE - (TILE_SIZE/3))) {
                Movement.queuedMove = direction;
                return true;
            }
            return false;
        }

        const targetPosition = Movement.getTargetPosition($hero, direction);
        if (!$board.isWalkable(targetPosition)) {
            $hero.sprite.loop('idle-' + direction);
            return false;
        }

        Movement.move($hero, targetPosition, direction);

        return true;
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
            if (creature.isHero() && Movement.queuedMove) {
                direction = Movement.queuedMove;
                Movement.queuedMove = null;
                if (Movement.walk(direction)) return;
            }
            if (Movement.path) {
                if (isSamePosition(Movement.path.destination, position)) {
                    Movement.clearPath();
                } else {
                    Movement.makePathStep();
                    return
                }
            }
            creature.sprite.loop('idle-' + direction);
        }
    }

    static getDirection(position1, position2) {
        if (position1.x < position2.x) {
            return 'east';
        }
        if (position1.x > position2.x) {
            return 'west';
        }
        if (position1.y > position2.y) {
            return 'north';
        }
        if (position1.y < position2.y) {
            return 'south';
        }
    }

    static getTargetPosition(creature, direction) {
        const map = {
            'north': {x: 0, y: -1},
            'south': {x: 0, y: 1},
            'west': {x: -1, y: 0},
            'east': {x: 1, y: 0}
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

    static clearPath() {
        Movement.path = null;
    }

    static setPath(destination, action, actionData = null) {
        Movement.path = {
            destination: {...destination},
            action: action,
            actionData: actionData
        }
        if (!$hero.movement.isMoving) {
            Movement.makePathStep();
        }
    }

    static makePathStep() {
        if (!Movement.path || isSamePosition(Movement.path.destination, $hero.position)) {
            Movement.path = null;
            $hero.sprite.loop('idle-south');
            return;
        }

        const grid = [];
        const startPosition = $board.positionServerToClient($hero.position);
        const endPosition = $board.positionServerToClient(Movement.path.destination);

        // prepare collisions grid
        for (let y = $board.firstTilePosition.y; y <= $board.lastTilePosition.y; y++) {
            const row = [];
            for (let x = $board.firstTilePosition.x; x <= $board.lastTilePosition.x; x++) {
                const position = {x: x, y: y};
                let isWalkable = isSamePosition(Movement.path.destination, position) ? true : $board.isWalkable(position);
                row.push(Number(isWalkable));
            }
            grid.push(row);
        }

        // find path
        Movement.easyStar.setGrid(grid);
        Movement.easyStar.setAcceptableTiles([1]);
        Movement.easyStar.findPath(startPosition.x, startPosition.y, endPosition.x, endPosition.y, (path) => {
            if (path === null) {
                console.log("Path was not found.");
                return;
            }
            if (Movement.path.action === 'use' && (path.length === 2 || isPositionInRange($hero.position, Movement.path.destination))) {
                $hero.sprite.loop('idle-south');
                Mouse.use(Movement.path.destination, Movement.path.actionData.itemId);
                Movement.clearPath();
                return;
            }
            if (Movement.path.action === 'move' && (path.length === 2 || isPositionInRange($hero.position, Movement.path.destination))) {
                $hero.sprite.loop('idle-south');
                if (Movement.path.actionData.itemId === $board.getTileTopItem(Movement.path.actionData.positionFrom)) {
                    Mouse.grabItemFrom(Movement.path.actionData.positionFrom);
                    Mouse.releaseItemOn(Movement.path.actionData.positionTo);
                }
                Movement.clearPath();
                return;
            }
            if (!Movement.walk(Movement.getDirection(startPosition, path[1]))) {
                Movement.clearPath();
            }
        });
        Movement.easyStar.calculate();
    }
}