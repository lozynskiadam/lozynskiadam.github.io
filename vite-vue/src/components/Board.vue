<template>
  <canvas id="board" :width="canvasWidth" :height="canvasHeight"></canvas>
</template>

<script>
import {BOARD_HEIGHT, BOARD_WIDTH, TILE_SIZE} from "../config.js";
import {$hero} from "../utils/globals.js";
import {randomString, roll} from "../utils/common.js";
import {isSamePosition} from "../utils/position.js";
import Creature from "../libs/Creature.js";
import Item from "../libs/Item.js";

export default {

  data() {
    return {
      width: BOARD_WIDTH,
      height: BOARD_HEIGHT,
      canvasWidth: TILE_SIZE * BOARD_WIDTH,
      canvasHeight: TILE_SIZE * BOARD_HEIGHT,
      firstTilePosition: null,
      lastTilePosition: null,
      tiles: {},
      effects: {},
      creatures: {},
    }
  },
  methods: {

    refresh() {
      this.firstTilePosition = {
        x: $hero.position.x - Math.floor(this.width / 2),
        y: $hero.position.y - Math.floor(this.height / 2),
      };
      this.lastTilePosition = {
        x: $hero.position.x + Math.floor(this.width / 2),
        y: $hero.position.y + Math.floor(this.height / 2),
      };

      for (const [name, creature] of Object.entries(this.creatures)) {
        if (!this.isOnArea(creature.position)) {
          delete this.creatures[name];
        }
      }

      const missingTilesPositions = [];
      const _tiles = {};
      for (let y = this.firstTilePosition.y; y <= this.lastTilePosition.y; y++) {
        for (let x = this.firstTilePosition.x; x <= this.lastTilePosition.x; x++) {
          _tiles[y] = _tiles[y] || {};
          if ((this.tiles[y]) && (this.tiles[y][x])) {
            _tiles[y][x] = this.tiles[y][x];
          } else {
            _tiles[y][x] = [];
            missingTilesPositions.push({x: x, y: y});
          }
        }
      }
      this.tiles = _tiles;
      this.requestTiles(missingTilesPositions);
    },

    getTileStack(position) {
      if (typeof this.tiles[position.y] == 'undefined' || typeof this.tiles[position.y][position.x] == 'undefined') {
        return []
      }

      return this.tiles[position.y][position.x];
    },

    getTileTopItem(position) {
      const stack = this.getTileStack(position);

      return stack[stack.length - 1] ?? null;
    },

    updateTile(position, stack) {
      if ((typeof this.tiles[position.y] != 'undefined') && (typeof this.tiles[position.y][position.x] != 'undefined')) {
        this.tiles[position.y][position.x] = stack;
      }
    },

    requestTiles(missingTilesPositions) {
      setTimeout(() => {
        for (const position of missingTilesPositions) {
          const stack = [];

          if (roll(40)) {
            stack.push(2);
          } else if (roll(40)) {
            stack.push(3);
          } else if (roll(30)) {
            stack.push(4);
          } else {
            stack.push(1)
          }

          if (!isSamePosition(position, $hero.position)) {
            if (roll(100)) {
              stack.push(6);
            } else if (roll(100)) {
              stack.push(8);
            } else if (roll(100)) {
              stack.push(5);
            } else if (roll(100)) {
              stack.push(7);
            }
          }

          this.updateTile(position, stack);

          if (roll(350)) {
            new Creature(randomString(20), position, {x: 0, y: 0})
          }
        }
      }, 100);
    },

    isOnArea(position) {
      return (position.x >= this.firstTilePosition.x && position.x <= this.lastTilePosition.x) && (position.y >= this.firstTilePosition.y && position.y <= this.lastTilePosition.y);
    },

    isWalkable(position) {
      const stack = this.getTileStack(position);

      if (!stack.find((itemId) => Item.get(itemId).type === 'ground')) {
        return false
      }
      if (stack.find((itemId) => Item.get(itemId).isBlockingCreatures)) {
        return false
      }

      return true;
    },

    positionClientToServer(position) {
      return {
        x: position.x + this.firstTilePosition.x,
        y: position.y + this.firstTilePosition.y,
      }
    },

    positionServerToClient(position) {
      return {
        x: position.x - this.firstTilePosition.x,
        y: position.y - this.firstTilePosition.y,
      }
    },

    getVisibleEffectsSprites(position) {
      if (this.effects && this.effects[position.y] && this.effects[position.y][position.x]) {
        return Object.values(this.effects[position.y][position.x]);
      }

      return [];
    },

  },
  mounted() {
    this.ctx = document.querySelector('#board').getContext("2d");
    window.addEventListener("hero-position-changed", () => {
      this.refresh();
    });
  }
}
</script>
