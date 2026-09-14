import { itemToRaw } from './catalog.js';
import { downloadText, pickFile } from './browserFiles.js';

/**
 * Browser-side items.json I/O: writing the edited catalog back out and
 * reading a PNG to use as an item's image. Kept out of the store so the
 * store never touches the DOM, like mapFile.js.
 *
 * items.json ships with the project and is fetched from the server, so a
 * browser cannot write it in place: "Save items.json" downloads the file
 * and you drop it back next to index.html.
 */

export const ITEMS_FILE_NAME = 'items.json';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** The catalog as items.json text: same shape, same key order and the same 4-space indent the file on disk uses. */
export function serializeItems(items) {
  return JSON.stringify(items.map(itemToRaw), null, 4);
}

export function downloadItemsFile(items) {
  downloadText(ITEMS_FILE_NAME, serializeItems(items));
}

/** Opens the native file picker for an item image; resolves with the chosen File, or null when the user cancels. */
export function pickImageFile() {
  return pickFile('image/png');
}

/**
 * An image file as base64, the way items.json stores it. Only PNG is
 * accepted: that is what the file's `image` field is documented to hold
 * and what every sprite already is, so a JPEG would be stored under a
 * mime type it does not have.
 */
export async function readImageFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (PNG_SIGNATURE.some((byte, index) => bytes[index] !== byte)) throw new Error('The image has to be a PNG file.');
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
