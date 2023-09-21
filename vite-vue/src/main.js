import { createApp } from 'vue'
import App from './App.vue'
import {EFFECTS_PATH, ITEMS_PATH, SPRITES_PATH} from "./config.js";
import './style.css'

import Sprite from "./libs/Sprite.js";
import Item from "./libs/Item.js";
import Effect from "./libs/Effect.js";
import Keyboard from "./libs/Keyboard.js";
import Mouse from "./libs/Mouse.js";
import Board from "./libs/Board.js";
import Renderer from "./libs/Renderer.js";
import Movement from "./libs/Movement.js";
import Creature from "./libs/Creature.js";
import {$hero, setHero} from "./utils/globals.js";
import Connector from "./libs/Connector.js";

const app = async () => {

    async function load() {
        await Sprite.load(SPRITES_PATH);
        await Item.load(ITEMS_PATH);
        await Effect.load(EFFECTS_PATH);

        // await Connector.connect().catch((error) => {
        //     console.log(error);
        // });
    }

    async function enter(hero) {
        setHero(hero);
        Keyboard.init();
        Mouse.init();
        Movement.init();
        Board.init();
        Renderer.render();
        Effect.get('energy').run($hero.position);
    }

    await load();
    await enter(new Creature('Nemnes', {x: 100, y: 100}, {x: 0, y: 0}));
}

app();

// createApp(App).mount('#app')
