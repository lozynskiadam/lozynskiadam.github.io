class Hero {
    position = {
        x: 100,
        y: 100,
    };
    offset = {
        x: 0,
        y: 0,
    };
    interval = null;
    sprite = null;

    constructor(sprite) {
        this.sprite = sprite;
    }

    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        window.dispatchEvent(new CustomEvent("hero-position-changed"));
    }

    walk(direction) {
        if (this.interval !== null) {
            return;
        }

        let targetPos = {}
        if (direction === 'up') targetPos = {x: this.position.x, y: this.position.y - 1};
        if (direction === 'down') targetPos = {x: this.position.x, y: this.position.y + 1};
        if (direction === 'left') targetPos = {x: this.position.x - 1, y: this.position.y};
        if (direction === 'right') targetPos = {x: this.position.x + 1, y: this.position.y};

        if (!board.isWalkable(targetPos.x, targetPos.y)) {
            return;
        }

        this.interval = setInterval(() => {
            if (direction === 'up') this.walkUp();
            if (direction === 'down') this.walkDown();
            if (direction === 'left') this.walkLeft();
            if (direction === 'right') this.walkRight();
            if (this.offset.x === 0 && this.offset.y === 0) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }, 10)
    }


    walkUp() {
        this.offset.y--;
        this.sprite.state('walkNorth');
        if (this.offset.y === -16) {
            this.position.y--;
            window.dispatchEvent(new CustomEvent("hero-position-changed"));
            this.offset.y = 16;
        }
        if (this.offset.x === 0 && this.offset.y === 0) {
            this.sprite.state('idleNorth');
        }
    }

    walkDown() {
        this.offset.y++;
        this.sprite.state('walkSouth');
        if (this.offset.y === 16) {
            this.position.y++;
            window.dispatchEvent(new CustomEvent("hero-position-changed"));
            this.offset.y = -16;
        }
        if (this.offset.x === 0 && this.offset.y === 0) {
            this.sprite.state('idleSouth');
        }
    }

    walkLeft() {
        this.offset.x--;
        this.sprite.state('walkWest');
        if (this.offset.x === -16) {
            this.position.x--;
            window.dispatchEvent(new CustomEvent("hero-position-changed"));
            this.offset.x = 16;
        }
        if (this.offset.x === 0 && this.offset.y === 0) {
            this.sprite.state('idleWest');
        }
    }

    walkRight() {
        this.offset.x++;
        this.sprite.state('walkEast');
        if (this.offset.x === 16) {
            this.position.x++;
            window.dispatchEvent(new CustomEvent("hero-position-changed"));
            this.offset.x = -16;
        }
        if (this.offset.x === 0 && this.offset.y === 0) {
            this.sprite.state('idleEast');
        }
    }
}
