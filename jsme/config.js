export default {
  itemsUrl: 'data/items.json',
  mapUrl: 'data/map.json', // the map the editor opens on; its envelope is where File → New goes back to
  terrainsUrl: 'data/terrains.json', // terrain patterns the brush fringes itself with; optional, missing means none
  tileSize: 32,
  maxElevation: 64, // px; a tile stack never lifts an item more than this
  maxLightLevel: 16, // tiles; the furthest an item's light may reach
  minFloor: -7,
  maxFloor: 7,
};
