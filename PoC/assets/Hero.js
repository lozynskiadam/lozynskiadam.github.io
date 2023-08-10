class Hero {
    position = {
        x: 10,
        y: 10
    };

    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        board.update();
    }
}
