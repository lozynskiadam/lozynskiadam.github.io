import { isValidMapData } from './mapData.js';

/**
 * Browser-side map file I/O (file picker, FileReader, download link).
 * Kept out of the store so the store never touches the DOM.
 */

export const MAP_FILE_NAME = 'map.json';

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

/** Reads and validates a map file; rejects with a user-presentable message. */
export async function readMapFile(file) {
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('Selected file is not a valid map editor file');
  }
  if (!isValidMapData(parsed)) throw new Error('Selected file is not a valid map editor file');
  return parsed;
}

export function downloadMapFile(data, filename = MAP_FILE_NAME) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
