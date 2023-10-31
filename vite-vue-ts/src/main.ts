import { createApp } from 'vue'
import App from './App.vue'
import {globals} from "./utils/globals.js";

globals().setApp(document.querySelector('#app'));
createApp(App).mount('#app')
