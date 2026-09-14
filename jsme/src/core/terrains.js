/**
 * Terrain patterns: a ground item plus the sprites that fringe it, so the
 * brush can lay the edges down on its own.
 *
 * A pattern is 13 catalog items - the ground the brush paints, 8 outer
 * pieces (the ring around a rectangular patch: 4 sides and 4 convex
 * corners) and 4 inner pieces (the concave corners a patch grows when it
 * bends around a tile). Every slot is named after where the piece sits
 * relative to the terrain, which is also how the editor lays them out:
 *
 *      nw   n   ne          inner:   nw  ne
 *       w  GND   e                   sw  se
 *      sw   s   se
 *
 * So a piece never goes on a terrain tile: it goes on the neighbour it
 * borders, above that tile's ground (see store.applyTerrainBorders).
 * `outer.n` is the piece for the tile directly north of the terrain, and
 * `inner.nw` the one for a tile with terrain to its south *and* east.
 *
 * This module is pure data plus the rule that picks pieces for one tile;
 * the store owns where they land and what happens to the old ones.
 */

/** Slot names of the ring around a terrain patch, in reading order of the 3x3 grid the dialog draws. */
export const OUTER_SLOTS = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

/** Slot names of the concave corners, in reading order of their 2x2 grid. */
export const INNER_SLOTS = ['nw', 'ne', 'sw', 'se'];

/** Tile offset of each neighbour, keyed by the direction it lies in. */
export const NEIGHBOURS = {
  nw: [-1, -1],
  n: [0, -1],
  ne: [1, -1],
  w: [-1, 0],
  e: [1, 0],
  sw: [-1, 1],
  s: [0, 1],
  se: [1, 1],
};

// Two orthogonal neighbours that are terrain make a concave corner, filled
// by one inner piece instead of the two straight pieces it replaces.
const INNER_CORNERS = [
  ['s', 'e', 'nw'],
  ['s', 'w', 'ne'],
  ['n', 'e', 'sw'],
  ['n', 'w', 'se'],
];

// Terrain in one direction, and the straight piece that fringes it.
const STRAIGHTS = [
  ['n', 's'],
  ['e', 'w'],
  ['s', 'n'],
  ['w', 'e'],
];

// A diagonal neighbour alone is a convex corner of the patch - but only
// while neither orthogonal neighbour beside it is terrain, because a
// straight piece already covers that side.
const OUTER_CORNERS = [
  ['se', 's', 'e', 'nw'],
  ['sw', 's', 'w', 'ne'],
  ['ne', 'n', 'e', 'sw'],
  ['nw', 'n', 'w', 'se'],
];

/** An empty slot map, so every pattern carries the same keys whatever a file left out. */
function emptySlots(names) {
  return Object.fromEntries(names.map((name) => [name, null]));
}

/** An item id as a pattern stores it: a string, or null for an unfilled slot. */
function slotId(value) {
  return value === null || value === undefined || value === '' ? null : String(value);
}

function readSlots(names, raw) {
  const slots = emptySlots(names);
  if (raw && typeof raw === 'object') {
    for (const name of names) slots[name] = slotId(raw[name]);
  }
  return slots;
}

/** A terrain pattern in canonical form - the shape the store and terrains.json both hold. */
export function createTerrain(raw = {}) {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    groundId: slotId(raw.groundId),
    outer: readSlots(OUTER_SLOTS, raw.outer),
    inner: readSlots(INNER_SLOTS, raw.inner),
  };
}

/** The pattern back in its file form; the same keys, detached from the store's reactive copy. */
export function terrainToRaw(terrain) {
  return {
    id: terrain.id,
    name: terrain.name,
    groundId: terrain.groundId,
    outer: { ...terrain.outer },
    inner: { ...terrain.inner },
  };
}

/** Every item id the pattern uses as a border piece - what the editor removes when re-fringing a tile. */
export function borderItemIds(terrain) {
  const ids = new Set();
  for (const slots of [terrain.outer, terrain.inner]) {
    for (const id of Object.values(slots)) if (id) ids.add(id);
  }
  return ids;
}

/** Whether a pattern can be drawn at all: it needs a ground item and at least one piece. */
export function isUsableTerrain(terrain) {
  return Boolean(terrain.groundId) && borderItemIds(terrain).size > 0;
}

/**
 * The pieces one tile needs, given which of its 8 neighbours are terrain.
 * Pure: it names slots, and the caller turns them into item ids.
 *
 * `has(group, slot)` reports whether the pattern actually fills a slot. An
 * unfilled inner corner falls back to the two straight pieces it would
 * have replaced, so a half-finished pattern still paints something
 * sensible rather than leaving a hole.
 *
 * Returns bottom-to-top: the big concave pieces first, then the sides,
 * then the small convex corners on top.
 */
export function borderPlan(neighbours, has = () => true) {
  const pieces = [];
  const covered = new Set();

  for (const [a, b, slot] of INNER_CORNERS) {
    if (!neighbours[a] || !neighbours[b] || !has('inner', slot)) continue;
    pieces.push({ group: 'inner', slot });
    covered.add(a);
    covered.add(b);
  }

  for (const [direction, slot] of STRAIGHTS) {
    if (neighbours[direction] && !covered.has(direction) && has('outer', slot)) {
      pieces.push({ group: 'outer', slot });
    }
  }

  for (const [diagonal, a, b, slot] of OUTER_CORNERS) {
    if (neighbours[diagonal] && !neighbours[a] && !neighbours[b] && has('outer', slot)) {
      pieces.push({ group: 'outer', slot });
    }
  }

  return pieces;
}
