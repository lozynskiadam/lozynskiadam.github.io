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
    speed = 500; // miliseconds to pass tile
    movement = {
        queuedMove: null,
        interval: null,
        currentFrame: 0,
    };

    constructor(sprite) {
        this.sprite = sprite;
    }

    setPosition(x, y) {
        this.position = {x: x, y: y};
        window.dispatchEvent(new CustomEvent("hero-position-changed"));
    }

    walk(direction) {
        if (this.movement.interval !== null) {
            if (this.movement.currentFrame > (TILE_SIZE - (TILE_SIZE/3))) {
                this.movement.queuedMove = direction;
                return true;
            }
            return false;
        }

        const targetPosition = this.getTargetPosition(direction);
        if (!board.isWalkable(targetPosition.x, targetPosition.y)) {
            return false;
        }

        this.movement.interval = setInterval(() => {
            this.sprite.state('walk-' + direction);
            this.movement.currentFrame++;
            this.updateOffsetAfterAnimationFrameChange(direction);
            if (this.movement.currentFrame === (TILE_SIZE / 2)) {
                this.position = targetPosition;
                window.dispatchEvent(new CustomEvent("hero-position-changed"));
                this.updateOffsetAfterPositionChange(direction);
            }
            if (this.movement.currentFrame === TILE_SIZE) {
                clearInterval(this.movement.interval);
                this.movement.interval = null;
                this.movement.currentFrame = 0;
                if (this.movement.queuedMove) {
                    direction = this.movement.queuedMove;
                    this.movement.queuedMove = null;
                    if (!this.walk(direction)) {
                        this.sprite.state('idle-' + direction);
                    }
                } else {
                    this.sprite.state('idle-' + direction);
                }
            }
        }, this.speed / TILE_SIZE);

        return true;
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
