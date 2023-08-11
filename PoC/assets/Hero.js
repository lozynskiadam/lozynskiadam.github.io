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

    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        window.dispatchEvent(new CustomEvent("hero-position-changed"));
    }

    walk(direction) {
        if (this.interval !== null) {
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
        if (this.offset.y === -16) {
            this.position.y--;
            window.dispatchEvent(new CustomEvent("hero-position-changed"));
            this.offset.y = 16;
        }
    }

    walkDown() {
        this.offset.y++;
        if (this.offset.y === 16) {
            this.position.y++;
            window.dispatchEvent(new CustomEvent("hero-position-changed"));
            this.offset.y = -16;
        }
    }

    walkLeft() {
        this.offset.x--;
        if (this.offset.x === -16) {
            this.position.x--;
            window.dispatchEvent(new CustomEvent("hero-position-changed"));
            this.offset.x = 16;
        }
    }

    walkRight() {
        this.offset.x++;
        if (this.offset.x === 16) {
            this.position.x++;
            window.dispatchEvent(new CustomEvent("hero-position-changed"));
            this.offset.x = -16;
        }
    }
}
