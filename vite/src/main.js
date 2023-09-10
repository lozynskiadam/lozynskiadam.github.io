import Sprite from "./libs/Sprite.js";
import Item from "./libs/Item.js";
import Effect from "./libs/Effect.js";
import Keyboard from "./libs/Keyboard.js";
import Mouse from "./libs/Mouse.js";
import Hero from "./libs/Hero.js";
import Board from "./libs/Board.js";
import Renderer from "./libs/Renderer.js";

import './style.css'

const app = async () => {

    async function load() {
        await Sprite.load('data/sprites.json');
        await Item.load('data/items.json');
        await Effect.load('data/effects.json');
    }

    async function init() {
        Keyboard.init();
        Mouse.init();
        Hero.init();
        Board.init();
        Renderer.render();
    }

    await load();
    await init();
}

app();
