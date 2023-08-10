const areaWidth = 5;
const areaHeight = 5;
const position = {x: 10, y: 10};
window.area = {};

function refreshArea()
{
    let fromX = position.x - Math.floor(areaWidth/2);
    let toX = position.x + Math.floor(areaWidth/2);
    let fromY = position.y - Math.floor(areaHeight/2);
    let toY = position.y + Math.floor(areaHeight/2);

    const missingTiles = [];
    const freshArea = {};
    for (let y = fromY; y <= toY; y++) {
        for (let x = fromX; x <= toX; x++) {
            freshArea[y] = freshArea[y] || {};
            if ((window.area[y]) && (window.area[y][x])) {
                freshArea[y][x] = window.area[y][x];
            } else {
                freshArea[y][x] = null;
                missingTiles.push({x: x, y: y});
            }
        }
    }
    window.area = freshArea;
    requestTiles(missingTiles);
}

function requestTiles(missingTiles)
{
    for (const tile of missingTiles) {
        if ((window.area[tile.y]) && (window.area[tile.y][tile.x])) {
            window.area[tile.y][tile.x] = [1];
        }
    }
}

refreshArea();
console.log(window.area);

setTimeout(() => {
    position.x = 12;
    position.y = 12;
    refreshArea();
    console.log(window.area);
}, 2000);
