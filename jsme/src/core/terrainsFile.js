import { createTerrain, terrainToRaw } from './terrains.js';
import { downloadText } from './browserFiles.js';

/**
 * Browser-side terrains.json I/O, the same deal as items.json: the file
 * ships with the project and is fetched from the server, so saving means
 * downloading it and dropping it back next to index.html.
 *
 * The file is optional. A deployment without one simply starts with no
 * patterns (the brush then behaves as it always did), which is why a
 * missing file reads as an empty list rather than an error - only a file
 * that is there but is not a list of patterns is one.
 */

export const TERRAINS_FILE_NAME = 'terrains.json';

/** The patterns as terrains.json text: same shape, same key order, same 4-space indent as items.json. */
export function serializeTerrains(terrains) {
  return JSON.stringify(terrains.map(terrainToRaw), null, 4);
}

export function downloadTerrainsFile(terrains) {
  downloadText(TERRAINS_FILE_NAME, serializeTerrains(terrains));
}

/** The patterns from a URL, cache-busted like the item catalog; `[]` when there is no such file. */
export async function fetchTerrains(url) {
  const response = await fetch(`${url}?v=${Date.now()}`);
  if (!response.ok) return [];
  const raw = await response.json();
  if (!Array.isArray(raw)) throw new Error(`${url} is not a list of terrain patterns`);
  return raw.map(createTerrain);
}
