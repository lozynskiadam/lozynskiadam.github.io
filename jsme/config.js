export default {
  itemsUrl: 'items.json',
  mapUrl: 'default-map.json', // the map the editor opens on; its envelope is where File → New goes back to
  tileSize: 32,
  maxElevation: 64, // px; a tile stack never lifts an item more than this
  maxLightLevel: 16, // tiles; the furthest an item's light may reach
  minFloor: -7,
  maxFloor: 7,
};
