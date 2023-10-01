export const isPosition = function (object) {
    return object.hasOwnProperty('x') && object.hasOwnProperty('y');
}

export const isPositionInRange = function (position1, position2, radius = 1) {
    const fromX = position1.x - radius;
    const fromY = position1.y - radius;
    const toX = position1.x + radius;
    const toY = position1.y + radius;

    return (position2.x >= fromX && position2.x <= toX) && (position2.y >= fromY && position2.y <= toY);
}

export const isSamePosition = function (position1, position2) {
    return position1.x === position2.x && position1.y === position2.y;
}
