class Viewport {

    static width = 3;

    static height = 3;

    fields = {};

    creatures = {};

    constructor() {
    }

    getField(x, y) {
        return this.fields[y][x] ?? null;
    }

    requestField(x, y) {

    }
}
