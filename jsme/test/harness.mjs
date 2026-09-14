/**
 * Enough of a browser for the editor to run under `node --test`.
 *
 * The app has no build step, so its modules are the same ones the browser
 * loads; what is missing here is only the environment around them. Vue is
 * driven through createRenderer() with a tiny virtual DOM, so mounting the
 * real components needs no jsdom.
 *
 * Import this module (for its side effects) before anything under src/.
 */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', times: '×', mdash: '—' };

function decodeEntities(html) {
  return html
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name] ?? whole);
}

/** A DOM node just rich enough for Vue's compiler, its directives and the app's own reads. */
export class FakeElement {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.nodeType = 1;
    this.children = [];
    this.childNodes = [];
    this.parentNode = null;
    this.attrs = {};
    this.style = {};
    this.classList = { add() {}, remove() {} };
    this.listeners = new Map();
    this.textContent = '';
    // v-model on a <select> walks el.options on mount.
    this.options = [];
    this.value = '';
    this.checked = false;
  }

  // Vue's compiler decodes entities through a scratch element: text via
  // innerHTML -> textContent, attributes via children[0].getAttribute().
  set innerHTML(html) {
    const attribute = /^<div foo="([\s\S]*)">$/.exec(html);
    if (attribute) {
      const holder = new FakeElement('div');
      holder.setAttribute('foo', decodeEntities(attribute[1]));
      this.children = [holder];
      this.textContent = '';
      return;
    }
    this.children = [];
    this.textContent = decodeEntities(html);
  }

  setAttribute(name, value) {
    this.attrs[name] = String(value);
  }

  getAttribute(name) {
    return name in this.attrs ? this.attrs[name] : null;
  }

  removeAttribute(name) {
    delete this.attrs[name];
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }

  removeEventListener(type, handler) {
    this.listeners.get(type)?.delete(handler);
  }

  click() {}

  focus() {}

  blur() {}

  getBoundingClientRect() {
    return { left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 };
  }

  // The map canvas asks for WebGL; refusing makes the renderer report the
  // failure and carry on, which is exactly the path we want under test.
  getContext() {
    return null;
  }

  querySelector() {
    return null;
  }

  contains() {
    return false;
  }

  closest() {
    return null;
  }

  get className() {
    return this.attrs.class ?? '';
  }
}

class FakeText {
  constructor(text) {
    this.nodeType = 3;
    this.textContent = String(text);
    this.parentNode = null;
  }
}

/** Window-level listeners, so a test can dispatch a keydown the way the app sees one. */
export const windowListeners = new Map();

function listenerCount(type) {
  return windowListeners.get(type)?.size ?? 0;
}

export function dispatchWindow(type, event) {
  for (const handler of [...(windowListeners.get(type) ?? [])]) handler(event);
}

export function keydown(init) {
  dispatchWindow('keydown', {
    key: '',
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    target: null,
    preventDefault() {},
    stopPropagation() {},
    ...init,
  });
}

export { listenerCount };

/** Whatever `fetch` should answer with; a test may swap it per case. */
export const responses = {
  'items.json': [],
  'default-map.json': { name: 'Test map', respawnPoint: [10, 10, 0], map: {} },
};

function installGlobals() {
  const documentStub = {
    documentElement: new FakeElement('html'),
    createElement: (tag) => new FakeElement(tag),
    createTextNode: (text) => new FakeText(text),
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => null,
  };

  globalThis.document = documentStub;
  globalThis.HTMLElement = FakeElement;
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });

  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 800,
    addEventListener(type, handler) {
      if (!windowListeners.has(type)) windowListeners.set(type, new Set());
      windowListeners.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      windowListeners.get(type)?.delete(handler);
    },
    document: documentStub,
  };

  globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(0), 0);
  globalThis.cancelAnimationFrame = (handle) => clearTimeout(handle);
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };

  // Sprites "decode" on the next microtask, the way a real Image does.
  globalThis.Image = class {
    constructor() {
      this.width = 32;
      this.height = 32;
      this._src = '';
    }
    set src(value) {
      this._src = value;
      queueMicrotask(() => this.onload?.());
    }
    get src() {
      return this._src;
    }
  };

  globalThis.fetch = async (url) => {
    const name = String(url).split('?')[0];
    const body = responses[name];
    if (body === undefined) return { ok: false, status: 404, json: async () => null };
    return { ok: true, status: 200, json: async () => body };
  };

  globalThis.URL.createObjectURL = () => 'blob:test';
  globalThis.URL.revokeObjectURL = () => {};
  globalThis.confirm = () => true;
  globalThis.alert = () => {};
}

installGlobals();

const { createRenderer } = await import('../src/vendor/vue.esm-browser.prod.js');

const nodeOps = {
  createElement: (tag) => new FakeElement(tag),
  createText: (text) => new FakeText(text),
  createComment: (text) => new FakeText(text),
  setText: (node, text) => {
    node.textContent = String(text);
  },
  setElementText: (el, text) => {
    el.textContent = String(text);
    el.childNodes = [];
  },
  insert: (child, parent, anchor) => {
    child.parentNode = parent;
    const index = anchor ? parent.childNodes.indexOf(anchor) : -1;
    if (index === -1) parent.childNodes.push(child);
    else parent.childNodes.splice(index, 0, child);
  },
  remove: (child) => {
    const parent = child.parentNode;
    if (!parent) return;
    const index = parent.childNodes.indexOf(child);
    if (index !== -1) parent.childNodes.splice(index, 1);
    child.parentNode = null;
  },
  parentNode: (node) => node.parentNode ?? null,
  nextSibling: (node) => {
    const siblings = node.parentNode?.childNodes ?? [];
    return siblings[siblings.indexOf(node) + 1] ?? null;
  },
  querySelector: () => null,
  setScopeId() {},
  cloneNode: (node) => node,
  insertStaticContent: () => [null, null],
};

function patchProp(el, key, previous, next) {
  if (key === 'style') {
    Object.assign(el.style, next ?? {});
  } else if (key.startsWith('on')) {
    el.addEventListener(key.slice(2).toLowerCase(), next);
  } else if (next === null || next === undefined || next === false) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, next === true ? '' : next);
  }
}

const { createApp } = createRenderer({ patchProp, ...nodeOps });

/** Mounts a component into a detached root and returns { root, app, text() }. */
export function mount(component, props) {
  const root = new FakeElement('div');
  const app = createApp(component, props);
  app.mount(root);
  return {
    root,
    app,
    /** Everything the tree renders, flattened - enough to assert on what is on screen. */
    text: () => collectText(root),
    /** Every class name present anywhere in the tree. */
    classes: () => collectClasses(root, new Set()),
  };
}

function collectText(node) {
  if (node.nodeType === 3) return node.textContent;
  const own = node.childNodes.length === 0 ? node.textContent : '';
  return own + node.childNodes.map(collectText).join(' ');
}

function collectClasses(node, into) {
  if (node.nodeType === 1) {
    for (const name of String(node.attrs.class ?? '').split(/\s+/)) if (name) into.add(name);
    for (const child of node.childNodes) collectClasses(child, into);
  }
  return into;
}

/** Lets pending promises, microtasks and one animation frame settle. */
export async function settle(times = 3) {
  for (let i = 0; i < times; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}
