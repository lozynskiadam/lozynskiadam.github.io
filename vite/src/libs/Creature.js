import Board from "./Board.js";
import Sprite from "./Sprite.js";
import Utils from "./Utils.js";

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

    constructor(name, position, offset) {
        Board.creatures[name] = this;
        this.position = position;
        this.offset = offset;
        this.sprite = Sprite.get('outfit').clone()
        this.sprite.dye([Utils.randomColor(), Utils.randomColor(), Utils.randomColor(), Utils.randomColor()]);
        this.sprite.loop('idle-south');
    }
}
