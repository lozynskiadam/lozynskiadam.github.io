const areaWidth = 5;
const areaHeight = 5;
const position = {};
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
    document.querySelector('#area').innerText = JSON.stringify(window.area, null, 4);
}

function requestTiles(missingTiles) {
    for (const tile of missingTiles) {
        if ((typeof window.area[tile.y] != 'undefined') && (typeof window.area[tile.y][tile.x] != 'undefined')) {
            window.area[tile.y][tile.x] = [];
        }
    }
}

setPosition(100, 100);

function setPosition(x, y) {
    position.x = x;
    position.y = y;
    refreshArea();
}