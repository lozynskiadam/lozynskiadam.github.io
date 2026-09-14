import { reactive, ref } from '../vendor/vue.esm-browser.prod.js';
import { config } from '../editor.js';

/**
 * The name + respawn point a project is described by, as an editable draft.
 * Shared by the two dialogs that ask for exactly those fields: File →
 * Properties… (editing the open project) and New project.
 *
 * Nothing reaches the store until read() returns: both dialogs are meant to
 * leave the current project untouched if they are cancelled.
 */

function parseCoordinate(value, label, min, max) {
  const number = Number(value);
  if (value === '' || value === null || !Number.isInteger(number)) throw new Error(`${label} must be a whole number.`);
  if (number < min || number > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return number;
}

export function useProjectForm({ name, respawnPoint }, { missingNameMessage }) {
  const fields = reactive({ name, x: respawnPoint[0], y: respawnPoint[1], z: respawnPoint[2] });
  const error = ref('');

  /** The validated `{ name, respawnPoint }`, or null with `error` set to the first thing that is wrong. */
  function read() {
    const trimmed = String(fields.name).trim();
    if (!trimmed) {
      error.value = missingNameMessage;
      return null;
    }
    try {
      const point = [
        parseCoordinate(fields.x, 'X', 0, Number.MAX_SAFE_INTEGER),
        parseCoordinate(fields.y, 'Y', 0, Number.MAX_SAFE_INTEGER),
        parseCoordinate(fields.z, 'Floor', config.minFloor, config.maxFloor),
      ];
      error.value = '';
      return { name: trimmed, respawnPoint: point };
    } catch (validation) {
      error.value = validation.message;
      return null;
    }
  }

  return { fields, error, read };
}
