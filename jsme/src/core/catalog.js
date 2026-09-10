/**
 * The item catalog: everything the editor can place, loaded once from
 * `config.itemsUrl`. Items are indexed by id in a Map because the renderer
 * and the placement rules look them up for every entry on every tile - a
 * linear search through a thousand-item list there was the editor's single
 * hottest path.
 */

function decodeItemImage(raw) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ ...raw, id: String(raw.id), src: image.src, image });
    image.onerror = () => reject(new Error(`Failed to decode image for item ${raw.id}`));
    image.src = `data:image/png;base64,${raw.image}`;
  });
}

export function createCatalog(items) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const byLayer = {};
  for (const item of items) (byLayer[item.layer] ??= []).push(item);

  return {
    items,
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
  return createCatalog(await Promise.all(raw.map(decodeItemImage)));
}
