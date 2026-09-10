import config from '../config.js';
import { createStore } from './core/store.js';
import { createTools } from './core/tools.js';
import { createActions } from './core/actions.js';
import { MapRenderer } from './core/renderer.js';

/**
 * The editor's singleton wiring: one store, one toolset, one action
 * registry, one renderer, shared by every component. There is only ever a
 * single map editor instance on the page, so a module-level singleton keeps
 * call sites simple (components just import what they need from this file)
 * without the ceremony of provide/inject for something that never needs a
 * second copy.
 *
 * Data flows one way: UI/keyboard -> actions/tools -> store -> renderer.
 * The renderer subscribes to the store, so nothing above it ever has to
 * ask for a repaint.
 */
export const store = createStore(config);
export const tools = createTools(store, config);
export const actions = createActions({ store, tools });
export const renderer = new MapRenderer(store, tools, config);

export { config };
