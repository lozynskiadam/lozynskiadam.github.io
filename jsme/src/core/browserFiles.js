/**
 * The two browser file gestures the editor needs - "pick a file" and "here,
 * save this" - in one place, so mapFile.js and itemsFile.js only describe
 * *what* they read and write, not how a browser is talked into it.
 *
 * Both are DOM-only on purpose: nothing above them (the store, the actions)
 * ever touches an <input> or an <a>.
 */

/** Opens the native file picker; resolves with the chosen File, or null when the user cancels. */
export function pickFile(accept) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change', () => resolve(input.files[0] ?? null));
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

/**
 * Hands the browser a file to save under `fileName`.
 *
 * The object URL is revoked on the next turn of the event loop rather than
 * right after click(): some browsers start reading it asynchronously, and
 * pulling it out from under them cancels the download.
 */
export function downloadText(fileName, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.download = fileName;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
