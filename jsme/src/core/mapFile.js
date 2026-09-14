import { isValidMapData } from './mapData.js';

/**
 * Browser-side map file I/O (file picker, FileReader, download link) and
 * the file envelope: `{ name, respawnPoint: [x, y, z], map }`, where `map`
 * is the mapData structure. Kept out of the store so the store never
 * touches the DOM.
 */

const INVALID = 'Selected file is not a valid map editor file';

export function isValidRespawnPoint(value) {
  return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
}

/** Structural check for the envelope. */
export function isValidMapFile(value) {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value.name === 'string' &&
    isValidRespawnPoint(value.respawnPoint) &&
    isValidMapData(value.map)
  );
}

/** Opens the native file picker; resolves with the chosen File, or null when the user cancels. */
export function pickMapFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', () => resolve(input.files[0] ?? null));
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

/**
 * Parsed JSON as an envelope, or null when it is neither shape. Files from
 * before the envelope existed (a bare map object) still open - they come
 * back as `{ map }` and the store fills in the defaults.
 */
function toEnvelope(parsed) {
  if (isValidMapFile(parsed)) return { name: parsed.name, respawnPoint: parsed.respawnPoint, map: parsed.map };
  if (isValidMapData(parsed)) return { map: parsed };
  return null;
}

/** Reads and validates a picked map file; rejects with a user-presentable message. */
export async function readMapFile(file) {
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error(INVALID);
  }
  const envelope = toEnvelope(parsed);
  if (!envelope) throw new Error(INVALID);
  return envelope;
}

/**
 * The same envelope, fetched from a URL instead of picked: the map the
 * editor opens on (`config.mapUrl`). Cache-busted like the item catalog,
 * so editing the file next to index.html is enough to see it.
 */
export async function fetchMapFile(url) {
  const response = await fetch(`${url}?v=${Date.now()}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const envelope = toEnvelope(await response.json());
  if (!envelope) throw new Error(`${url} is not a valid map editor file`);
  return envelope;
}

/** "My Town!" -> "my-town.json"; falls back to map.json for an empty name. */
export function mapFileName(name) {
  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'map'}.json`;
}

export function downloadMapFile(envelope) {
  const blob = new Blob([JSON.stringify(envelope)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = mapFileName(envelope.name);
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
