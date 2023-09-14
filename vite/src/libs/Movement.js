import {TILE_SIZE} from "../config.js";
import Hero from "./Hero.js";
import Board from "./Board.js";
import * as EasyStar from "easystarjs";
import Mouse from "./Mouse.js";
import {isSamePosition} from "../utils/position.js";

export default class Movement {

    static easyStar = null;
    static targetPosition = null;

    static init() {
        Movement.easyStar = new EasyStar.js()
        window.addEventListener("move-north", () => {Movement.targetPosition = null; Hero.walk('north')});
        window.addEventListener("move-south", () => {Movement.targetPosition = null; Hero.walk('south')});
        window.addEventListener("move-west", () => {Movement.targetPosition = null; Hero.walk('west')});
        window.addEventListener("move-east", () => {Movement.targetPosition = null; Hero.walk('east')});
        window.addEventListener("map-click-step-done", Movement.mapClickStep);
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
            if (Movement.targetPosition) {
                window.dispatchEvent(new CustomEvent("map-click-step-done"));
                return
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

    static mapClick(use = false) {
        Movement.targetPosition = {...Mouse.positionServer};
        Movement.targetUse = use;
        Movement.mapClickStep();
    }

    static mapClickStep() {
        if (!Movement.targetPosition || isSamePosition(Movement.targetPosition, Hero.creature.position)) {
            Movement.targetPosition = null;
            Movement.targetUse = null;
            Hero.creature.sprite.loop('idle-south');
            return;
        }

        const grid = [];
        const startPosition = Board.positionServerToClient(Hero.creature.position);
        const endPosition = Board.positionServerToClient(Movement.targetPosition);

        for (let y = Board.area.fromY; y <= Board.area.toY; y++) {
            const row = [];
            for (let x = Board.area.fromX; x <= Board.area.toX; x++) {
                let isWalkable = Board.isWalkable({x: x, y: y});
                if (!isWalkable && Movement.targetUse) {
                    isWalkable = true;
                }
                row.push(Number(isWalkable));
            }
            grid.push(row);
        }

        Movement.easyStar.setGrid(grid);
        Movement.easyStar.setAcceptableTiles([1]);
        Movement.easyStar.findPath(
            startPosition.x,
            startPosition.y,
            endPosition.x,
            endPosition.y,
            (path) => {
                if (path === null) {
                    console.log("Path was not found.");
                    return;
                }
                if (Movement.targetUse && path.length === 2) {
                    console.log('Using object...');
                    Movement.targetPosition = null;
                    Movement.targetUse = null;
                    Hero.creature.sprite.loop('idle-south');
                    return;
                }
                Hero.walk(Movement.getDirection(startPosition, path[1]));
            }
        );
        Movement.easyStar.calculate();

        return grid;
    }
}
