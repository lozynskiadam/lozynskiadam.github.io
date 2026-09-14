/**
 * The item catalog: everything the editor can place, loaded once from
 * `config.itemsUrl`. Items are indexed by id in a Map because the renderer
 * and the placement rules look them up for every entry on every tile - a
 * linear search through a thousand-item list there was the editor's single
 * hottest path.
 *
 * A catalog is immutable: the items editor rebuilds it from an edited item
 * list (see store.replaceCatalogItems), which both re-indexes it and tells
 * the renderer to repaint, since it watches `store.catalog`.
 */

/**
 * The traits an item may carry. A closed set: anything else found in a
 * file's `traits` is dropped on load, so the editor only ever writes back
 * traits it knows.
 */
export const ITEM_TRAITS = ['ground', 'floor', 'blocking', 'movable', 'pickupable', 'stackable'];

/** A 32x32 fully transparent PNG - the placeholder image a brand new item starts with. */
export const BLANK_ITEM_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGklEQVR42u3BAQEAAACCIP+vbkhAAQAAAO8GECAAAcm1w7EAAAAASUVORK5CYII=';

/**
 * The one trait the editor itself acts on: a ground item sinks to the
 * bottom of a tile's stack and the eraser passes over it (see
 * `pushEntry` / `eraseOnTile` in store.js). Every other trait is written
 * to the file for the game to read.
 */
export function isGroundItem(item) {
  return Boolean(item?.traits?.includes('ground'));
}

/** Canonical trait list: known traits only, in ITEM_TRAITS order, without duplicates. */
export function normalizeTraits(traits) {
  const wanted = new Set(Array.isArray(traits) ? traits : []);
  return ITEM_TRAITS.filter((trait) => wanted.has(trait));
}

/** What an item that starts emitting light gets: a short warm pool of it. */
export const DEFAULT_LIGHT = { level: 3, color: '#ffa500' };

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * An item's light source in canonical form - `{ level, color }` with the
 * color as lowercase `#rrggbb` - or null when the item emits none.
 *
 * A light that is there but unusable (no level, a color in some other
 * notation) keeps the light and falls back to DEFAULT_LIGHT's value for
 * the broken field: a hand-edited items.json should not lose an item's
 * light over a typo in one of the two numbers.
 */
export function normalizeLight(light) {
  if (!light || typeof light !== 'object') return null;
  const level = Math.round(Number(light.level));
  const color = String(light.color ?? '');
  return {
    level: Number.isFinite(level) && level > 0 ? level : DEFAULT_LIGHT.level,
    color: HEX_COLOR.test(color) ? color.toLowerCase() : DEFAULT_LIGHT.color,
  };
}

/**
 * Builds a catalog item from its items.json form: the base64 PNG is
 * decoded into an `image` the renderer can draw and an `src` the UI can
 * put in an <img>, while the base64 itself is kept as `png` so the item
 * can be written back out unchanged (see itemToRaw). Only the fields
 * items.json defines survive, which keeps the round trip lossless.
 */
export function decodeItem(raw) {
  return new Promise((resolve, reject) => {
    const item = {
      id: String(raw.id),
      name: String(raw.name ?? ''),
      layer: String(raw.layer ?? ''),
      elevation: Number(raw.elevation) || 0,
      traits: normalizeTraits(raw.traits),
      light: normalizeLight(raw.light),
      png: raw.image,
    };
    const image = new Image();
    image.onload = () => resolve({ ...item, src: image.src, image });
    image.onerror = () => reject(new Error(`Failed to decode image for item ${raw.id}`));
    image.src = `data:image/png;base64,${item.png}`;
  });
}

/** An item back in its items.json form - the inverse of decodeItem, and the key order the file uses. */
export function itemToRaw(item) {
  return {
    id: String(item.id),
    name: item.name,
    layer: item.layer,
    elevation: item.elevation,
    traits: [...item.traits],
    light: item.light ? { level: item.light.level, color: item.light.color } : null,
    image: item.png,
  };
}

/**
 * Items whose name or id contains `needle`, case-insensitively - the
 * catalog search both the map palette and the items editor's list run over
 * whatever set of items their layer filter left them with.
 */
export function searchItems(items, needle) {
  const text = String(needle ?? '').trim().toLowerCase();
  if (!text) return items;
  return items.filter((item) => item.name.toLowerCase().includes(text) || item.id.includes(text));
}

export function createCatalog(items) {
  // Sorted by id, the way items.json itself is, so a renumbered or newly
  // added item lands where both the palette and the file expect it.
  const sorted = [...items].sort((a, b) => Number(a.id) - Number(b.id));
  const byId = new Map(sorted.map((item) => [item.id, item]));
  const byLayer = {};
  for (const item of sorted) (byLayer[item.layer] ??= []).push(item);

  return {
    items: sorted,
    layers: Object.keys(byLayer),
    byLayer,
    /** Catalog item for an id (string or number); null when unknown. */
    get(id) {
      if (id === null || id === undefined) return null;
      return byId.get(String(id)) ?? null;
    },
  };
}

export const EMPTY_CATALOG = createCatalog([]);

export async function loadCatalog(url) {
  const response = await fetch(`${url}?v=${Date.now()}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const raw = await response.json();
  if (!Array.isArray(raw)) throw new Error('Item list is not an array');
  return createCatalog(await Promise.all(raw.map(decodeItem)));
}
