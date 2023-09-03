class Hero {
    position = {
        x: 100,
        y: 100,
    };
    offset = {
        x: 0,
        y: 0,
    };
    sprite = null;
    speed = 2; // tiles per second
    movement = {
        queuedMove: null,
        isMoving: false,
        currentFrame: 0,
        timeouts: []
    };

    constructor(sprite) {
        this.sprite = sprite.clone()
        this.sprite.dye(['#ffffff', '#ffffff']);
        this.sprite.loop('idle-south');
        Effect.get('energy').run(this.position.x, this.position.y);

        window.addEventListener("move-north", () => {
            this.walk('north')
        });
        window.addEventListener("move-south", () => {
            this.walk('south')
        });
        window.addEventListener("move-west", () => {
            this.walk('west')
        });
        window.addEventListener("move-east", () => {
            this.walk('east')
        });
    }

    setPosition(x, y) {
        this.position = {x: x, y: y};
        this.movement.timeouts.forEach((timeout) => clearTimeout(timeout));
        this.movement.timeouts = [];
        this.movement.queuedMove = null;
        this.movement.isMoving = false;
        this.movement.currentFrame = 0;
        window.dispatchEvent(new CustomEvent("hero-position-changed"));
    }

    walk(direction) {
        if (this.movement.isMoving) {
            if (this.movement.currentFrame > (TILE_SIZE - (TILE_SIZE/3))) {
                this.movement.queuedMove = direction;
                return true;
            }
            return false;
        }

        const targetPosition = this.getTargetPosition(direction);
        if (!Board.isWalkable(targetPosition.x, targetPosition.y)) {
            this.sprite.loop('idle-' + direction);
            return false;
        }

        this.movement.isMoving = true;
        for (let i = 0; i < TILE_SIZE; i++) {
            const timeout = setTimeout(() => this.handleWalkFrame(direction, targetPosition), (1000 / this.speed / TILE_SIZE) * i);
            this.movement.timeouts.push(timeout);
        }

        return true;
    }

    handleWalkFrame(direction, targetPosition) {
        this.sprite.loop('walk-' + direction);
        this.movement.currentFrame++;
        this.updateOffsetAfterAnimationFrameChange(direction);
        if (this.movement.currentFrame === (TILE_SIZE / 2)) {
            this.position = targetPosition;
            window.dispatchEvent(new CustomEvent("hero-position-changed"));
            this.updateOffsetAfterPositionChange(direction);
        }
        if (this.movement.currentFrame === TILE_SIZE) {
            this.movement.isMoving = false;
            this.movement.currentFrame = 0;
            this.movement.timeouts.forEach((timeout) => clearTimeout(timeout));
            this.movement.timeouts = [];
            if (this.movement.queuedMove) {
                direction = this.movement.queuedMove;
                this.movement.queuedMove = null;
                if (!this.walk(direction)) {
                    this.sprite.loop('idle-' + direction);
                }
            } else {
                this.sprite.loop('idle-' + direction);
            }
        }
    }

    getTargetPosition(direction) {
        const map = {
            'north': { x: 0, y: -1 },
            'south': { x: 0, y: 1 },
            'west': { x: -1, y: 0 },
            'east': { x: 1, y: 0 }
        };

        return {
            x: this.position.x + map[direction].x,
            y: this.position.y + map[direction].y
        };
    }

    updateOffsetAfterAnimationFrameChange(direction) {
        const map = {
            'north': () => this.offset.y--,
            'south': () => this.offset.y++,
            'west': () => this.offset.x--,
            'east': () => this.offset.x++
        }
        map[direction]();
    }

    updateOffsetAfterPositionChange(direction) {
        const map = {
            'north': () => this.offset.y = (TILE_SIZE / 2),
            'south': () => this.offset.y = -(TILE_SIZE / 2),
            'west': () => this.offset.x = (TILE_SIZE / 2),
            'east': () => this.offset.x = -(TILE_SIZE / 2)
        }
        map[direction]();
    }
}
