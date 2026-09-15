import { parseCellKey } from './mapData.js';

function forEachBrushCell(size, callback) {
  for (let dy = -(size - 1); dy <= size - 1; dy++) {
    for (let dx = -(size - 1); dx <= size - 1; dx++) {
      callback(dx, dy);
    }
  }
}

/**
 * A 1px colored frame on the tile's outermost pixels with a 1px black frame
 * just inside it for contrast. Both rectangles sit on whole pixel rings
 * (the +0.5 centers a 1px stroke on a pixel) - the painter does not
 * antialias, so any half-pixel overlap would let black win over the color.
 */
function drawCellOutline(ctx, x, y, tileSize, outerColor) {
  ctx.lineWidth = 1;
  ctx.strokeStyle = outerColor;
  ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(x + 1.5, y + 1.5, tileSize - 3, tileSize - 3);
}

/**
 * Builds the editor's toolset. Each tool reacts to pointer input
 * (onClick/onDrag/onRelease) and draws its own HUD feedback (onRender),
 * operating purely through the store so this module never touches the DOM.
 *
 * A tool is plain data plus callbacks:
 *   name      - id, also used for its toolbar icon (see app.css `[data-icon]`)
 *   title     - human label; `shortcut` (a key name) and optional `hint`
 *               feed the toolbar tooltip, the keyboard map and the help dialog
 *   sizing    - whether the brush-size slider applies
 *   cursor    - CSS cursor over the map; `dragCursor()` may override it mid-drag
 *
 * To add a tool, append an entry here - the toolbar, shortcuts and help
 * dialog pick it up automatically (see actions.js).
 */
export function createTools(store, config) {
  function sampleTile({ x, y, z }) {
    const tile = store.getTile(x, y, z);
    if (!tile || tile.length === 0) return;
    store.selectItemAndReveal(tile[tile.length - 1].id);
  }

  /** Press and drag do the same thing for the painting tools, so they share one callback. */
  function paint({ x, y, z }) {
    forEachBrushCell(store.state.brushSize, (dx, dy) => store.drawOnTile(x + dx, y + dy, z));
  }

  // A brush wider than one tile wipes the whole stack, ground included; at
  // 1x1 the eraser only takes the top item and leaves the ground alone.
  function erase({ x, y, z }) {
    const wholeStack = store.state.brushSize > 1;
    forEachBrushCell(store.state.brushSize, (dx, dy) => store.eraseOnTile(x + dx, y + dy, z, { wholeStack }));
  }

  // Ephemeral drag state, private to this module - there is only ever one
  // instance of each tool, so it's fine to keep this outside the store
  // rather than making every mid-drag frame reactive.
  let selectionAnchor = null; // { x, y, z } captured when a "select" drag starts
  let moveDraft = null; // { block, z, originalX1, originalY1, grabOffsetX, grabOffsetY } while dragging a selection with "pointer"
  let pendingGrab = null; // { x, y, z } pressed on with "pointer" but not yet dragged - becomes a moveDraft in onDragStart

  function renderMovePreview(ctx, cursorX, cursorY) {
    const blockX = cursorX - moveDraft.grabOffsetX * config.tileSize;
    const blockY = cursorY - moveDraft.grabOffsetY * config.tileSize;

    // Drawn with the same glow used for a highlighted item on the map
    // itself (see MapRenderer.renderFloor), plus a small up-left shift, so
    // a drag reads as picking the thing up rather than just previewing a paste.
    for (const [key, entries] of Object.entries(moveDraft.block.cells)) {
      const [dx, dy] = parseCellKey(key);
      let lift = 0;
      for (const entry of entries) {
        const item = store.getItem(entry.id);
        if (!item) continue;
        const { x: drawX, y: drawY } = store.itemDrawPosition(
          item,
          blockX + dx * config.tileSize,
          blockY + dy * config.tileSize,
          lift + 6,
        );
        lift = Math.min(lift + (item.elevation ?? 0), config.maxElevation);
        ctx.drawImage(item.bitmap, drawX, drawY);
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(item.bitmap, drawX, drawY);
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 170, 255, 0.9)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      blockX + 0.5,
      blockY + 0.5,
      moveDraft.block.width * config.tileSize - 1,
      moveDraft.block.height * config.tileSize - 1,
    );
    ctx.restore();
  }

  return {
    pointer: {
      name: 'pointer',
      title: 'Pointer',
      shortcut: '1',
      sizing: false,
      cursor: 'default',
      /** Cursor to show mid-drag: a closed hand while something is actually being carried, otherwise the normal one. */
      dragCursor() {
        return moveDraft ? 'grabbing' : null;
      },
      onClick({ x, y, z }) {
        if (store.isInsideSelection(x, y, z)) {
          const draft = store.beginMoveSelection();
          if (draft) {
            moveDraft = {
              kind: 'selection',
              ...draft,
              grabOffsetX: x - draft.originalX1,
              grabOffsetY: y - draft.originalY1,
            };
          }
          return;
        }

        if (store.state.selection) store.clearSelection();

        // A press only highlights the tile's top item. The actual pick-up
        // waits for the mouse to move with the button held (see
        // onDragStart), so a plain click never disturbs the map.
        store.highlightOnTile(x, y, z);
        const tile = store.getTile(x, y, z);
        pendingGrab = tile && tile.length > 0 ? { x, y, z } : null;
      },
      onDragStart() {
        if (!pendingGrab) return;
        // The cursor moved after pressing on an item: lift it off its tile
        // so it follows the cursor like a normal drag&drop.
        const draft = store.beginItemMove(pendingGrab.x, pendingGrab.y, pendingGrab.z);
        pendingGrab = null;
        if (draft) moveDraft = { kind: 'item', ...draft, grabOffsetX: 0, grabOffsetY: 0 };
      },
      onRelease({ x, y, z }) {
        pendingGrab = null;
        if (!moveDraft) return;
        const targetX = x - moveDraft.grabOffsetX;
        const targetY = y - moveDraft.grabOffsetY;
        if (moveDraft.kind === 'item') {
          store.finishItemMove(moveDraft, targetX, targetY);
        } else {
          store.finishMoveSelection(moveDraft, targetX, targetY);
        }
        moveDraft = null;
      },
      onRender({ ctx, x, y }) {
        if (moveDraft) {
          renderMovePreview(ctx, x, y);
          return;
        }
        drawCellOutline(ctx, x, y, config.tileSize, '#ffffff');
      },
    },

    select: {
      name: 'select',
      title: 'Select',
      shortcut: '2',
      sizing: false,
      cursor: 'crosshair',
      onClick({ x, y, z }) {
        selectionAnchor = { x, y, z };
        store.beginSelection(x, y, z);
      },
      onDrag({ x, y, z }) {
        if (!selectionAnchor || z !== selectionAnchor.z) return;
        store.updateSelection(selectionAnchor.x, selectionAnchor.y, x, y);
      },
      onRelease() {
        selectionAnchor = null;
      },
      onRender({ ctx, x, y }) {
        drawCellOutline(ctx, x, y, config.tileSize, '#00aaff');
      },
    },

    brush: {
      name: 'brush',
      title: 'Brush',
      shortcut: '3',
      sizing: true,
      cursor: 'default',
      onClick: paint,
      onDrag: paint,
      onRender({ ctx, x, y, z, tileX, tileY }) {
        const item = store.selectedItem.value;
        if (!item) return;
        forEachBrushCell(store.state.brushSize, (dx, dy) => {
          // Preview the sprite where it will land: in its layer's slot when the
          // tile already has one (the brush replaces it), else on top of the stack.
          const tile = store.getTile(tileX + dx, tileY + dy, z) ?? [];
          const slot = tile.findIndex((entry) => store.getItem(entry.id)?.layer === item.layer);
          const lift = store.stackElevation(tile, slot === -1 ? tile.length : slot);
          const { x: drawX, y: drawY } = store.itemDrawPosition(
            item,
            x + dx * config.tileSize,
            y + dy * config.tileSize,
            lift,
          );
          ctx.drawImage(item.bitmap, drawX, drawY);
          drawCellOutline(ctx, x + dx * config.tileSize, y + dy * config.tileSize, config.tileSize, '#ffffff');
        });
      },
    },

    eraser: {
      name: 'eraser',
      title: 'Eraser',
      shortcut: '4',
      sizing: true,
      cursor: 'default',
      onClick: erase,
      onDrag: erase,
      onRender({ ctx, x, y }) {
        forEachBrushCell(store.state.brushSize, (dx, dy) => {
          drawCellOutline(ctx, x + dx * config.tileSize, y + dy * config.tileSize, config.tileSize, '#ff0000');
        });
      },
    },

    sampler: {
      name: 'sampler',
      title: 'Sampler',
      shortcut: '5',
      hint: 'hold Tab',
      sizing: false,
      cursor: 'crosshair',
      onClick: sampleTile,
      onDrag: sampleTile,
      onRender({ ctx, x, y }) {
        drawCellOutline(ctx, x, y, config.tileSize, '#ffffff');
      },
    },
  };
}
