class Hero {
    position = {
        x: 10,
        y: 10,
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
        switch (direction) {
            case 'right': return this.walkRight();
        }
    }

    walkRight() {
        if (this.interval !== null) {
            return;
        }
        this.interval = setInterval(() => {
            this.offset.x++;
            if (this.offset.x === 16) {
                this.position.x++;
                window.dispatchEvent(new CustomEvent("hero-position-changed"));
                this.offset.x = -16;
            }
            if (this.offset.x === 0) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }, 10);
    }
}
