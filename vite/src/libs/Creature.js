import Board from "./Board.js";
import Sprite from "./Sprite.js";
import Hero from "./Hero.js";
import Movement from "./Movement.js";
import {randomColor} from "../utils/common.js";

export default class Creature {

    position = {
        x: null,
        y: null,
    };

    offset = {
        x: null,
        y: null,
    }

    sprite = null;

    speed = 2; // tiles per second

    movement = {
        isMoving: false,
        currentFrame: 0,
        timeouts: []
    };

    constructor(name, position, offset) {
        Board.creatures[name] = this;
        this.position = position;
        this.offset = offset;
        this.sprite = Sprite.get('outfit').clone()
        this.sprite.dye([randomColor(), randomColor(), randomColor(), randomColor()]);
        this.sprite.loop('idle-south');
    }

    isHero() {
        return this === Hero.creature;
    }

    move(direction, position) {
        Movement.move(this, position, direction)
    }
}
