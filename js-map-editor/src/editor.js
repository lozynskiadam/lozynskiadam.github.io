import config from '../config.js';
import { createStore } from './core/store.js';
import { createTools } from './core/tools.js';
import { MapRenderer } from './core/renderer.js';

/**
 * The editor's singleton wiring: one store, one toolset, one renderer,
 * shared by every component. There is only ever a single map editor
 * instance on the page, so a module-level singleton keeps call sites
 * simple (components just import store/renderer/tools from this file)
 * without the ceremony of provide/inject for something that never needs
 * a second copy.
 */
export const store = createStore(config);
export const tools = createTools(store, config);
export const renderer = new MapRenderer(store, tools, config);

export { config };
