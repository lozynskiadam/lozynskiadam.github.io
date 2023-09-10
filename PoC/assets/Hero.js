class Hero {

    static position = {
        x: 100,
        y: 100,
    };

    static offset = {
        x: 0,
        y: 0,
    };

    static sprite = null;

    static speed = 2; // tiles per second

    static movement = {
        queuedMove: null,
        isMoving: false,
        currentFrame: 0,
        timeouts: []
    };

    static init() {
        Hero.sprite = Sprite.get('outfit').clone()
        Hero.sprite.dye([Utils.randomColor(), Utils.randomColor(), Utils.randomColor(), Utils.randomColor()]);
        Hero.sprite.loop('idle-south');
        Effect.get('energy').run(Hero.position.x, Hero.position.y);

        window.addEventListener("move-north", () => {
            Hero.walk('north')
        });
        window.addEventListener("move-south", () => {
            Hero.walk('south')
        });
        window.addEventListener("move-west", () => {
            Hero.walk('west')
        });
        window.addEventListener("move-east", () => {
            Hero.walk('east')
        });
        window.addEventListener("randomize-outfit", () => {
            Hero.sprite.dye([Utils.randomColor(), Utils.randomColor(), Utils.randomColor(), Utils.randomColor()]);
        });
    }

    static setPosition(x, y) {
        Hero.position = {x: x, y: y};
        Hero.movement.timeouts.forEach((timeout) => clearTimeout(timeout));
        Hero.movement.timeouts = [];
        Hero.movement.queuedMove = null;
        Hero.movement.isMoving = false;
        Hero.movement.currentFrame = 0;
        window.dispatchEvent(new CustomEvent("hero-position-changed"));
    }

    static walk(direction) {
        if (Hero.movement.isMoving) {
            if (Hero.movement.currentFrame > (TILE_SIZE - (TILE_SIZE/3))) {
                Hero.movement.queuedMove = direction;
                return true;
            }
            return false;
        }

        const targetPosition = Hero.getTargetPosition(direction);
        if (!Board.isWalkable(targetPosition.x, targetPosition.y)) {
            Hero.sprite.loop('idle-' + direction);
            return false;
        }

        Hero.movement.isMoving = true;
        for (let i = 0; i < TILE_SIZE; i++) {
            const timeout = setTimeout(() => Hero.handleWalkFrame(direction, targetPosition), (1000 / Hero.speed / TILE_SIZE) * i);
            Hero.movement.timeouts.push(timeout);
        }

        return true;
    }

    static handleWalkFrame(direction, targetPosition) {
        Hero.sprite.loop('walk-' + direction);
        Hero.movement.currentFrame++;
        Hero.updateOffsetAfterAnimationFrameChange(direction);
        if (Hero.movement.currentFrame === (TILE_SIZE / 2)) {
            Hero.position = targetPosition;
            window.dispatchEvent(new CustomEvent("hero-position-changed"));
            Hero.updateOffsetAfterPositionChange(direction);
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
                    Hero.sprite.loop('idle-' + direction);
                }
            } else {
                Hero.sprite.loop('idle-' + direction);
            }
        }
    }

    static getTargetPosition(direction) {
        const map = {
            'north': { x: 0, y: -1 },
            'south': { x: 0, y: 1 },
            'west': { x: -1, y: 0 },
            'east': { x: 1, y: 0 }
        };

        return {
            x: Hero.position.x + map[direction].x,
            y: Hero.position.y + map[direction].y
        };
    }

    static updateOffsetAfterAnimationFrameChange(direction) {
        const map = {
            'north': () => Hero.offset.y--,
            'south': () => Hero.offset.y++,
            'west': () => Hero.offset.x--,
            'east': () => Hero.offset.x++
        }
        map[direction]();
    }

    static updateOffsetAfterPositionChange(direction) {
        const map = {
            'north': () => Hero.offset.y = (TILE_SIZE / 2),
            'south': () => Hero.offset.y = -(TILE_SIZE / 2),
            'west': () => Hero.offset.x = (TILE_SIZE / 2),
            'east': () => Hero.offset.x = -(TILE_SIZE / 2)
        }
        map[direction]();
    }
}
