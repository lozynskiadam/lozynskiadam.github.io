import { onMounted, onUnmounted } from '../vendor/vue.esm-browser.prod.js';
import { store, renderer } from '../editor.js';

/** Wires up every keyboard shortcut for the lifetime of the component that calls this. */
export function useKeyboardShortcuts() {
  function handleKeyDown(event) {
    if (store.state.showHelp) {
      if (event.key === 'Escape') {
        event.preventDefault();
        store.state.showHelp = false;
      }
      return;
    }

    if (store.state.itemProperties) {
      if (event.key === 'Escape') {
        event.preventDefault();
        store.closeItemProperties();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        store.pan(0, -1);
        renderer.render('all');
        break;
      case 'ArrowDown':
        event.preventDefault();
        store.pan(0, 1);
        renderer.render('all');
        break;
      case 'ArrowLeft':
        event.preventDefault();
        store.pan(-1, 0);
        renderer.render('all');
        break;
      case 'ArrowRight':
        event.preventDefault();
        store.pan(1, 0);
        renderer.render('all');
        break;

      case '1':
        event.preventDefault();
        store.selectTool('pointer');
        renderer.render('current');
        break;
      case '2':
        event.preventDefault();
        store.selectTool('select');
        renderer.render('current');
        break;
      case '3':
        event.preventDefault();
        store.selectTool('brush');
        renderer.render('current');
        break;
      case '4':
        event.preventDefault();
        store.selectTool('eraser');
        renderer.render('current');
        break;
      case '5':
        event.preventDefault();
        store.selectTool('sampler');
        renderer.render('current');
        break;
      case 'c':
      case 'C':
        if (!event.ctrlKey && !event.metaKey) break;
        event.preventDefault();
        store.copySelection();
        break;
      case 'v':
      case 'V':
        if (!event.ctrlKey && !event.metaKey) break;
        event.preventDefault();
        store.pasteClipboard(store.state.cursorPosition.x, store.state.cursorPosition.y, store.state.currentFloor);
        renderer.render('current');
        break;
      case 'Tab':
        event.preventDefault();
        if (!store.state.tabDown) {
          store.state.tabDown = true;
          store.selectTool('sampler');
          renderer.render('current');
        }
        break;

      case 'x':
      case 'X':
        event.preventDefault();
        store.swapItems();
        break;

      case 'PageUp':
        event.preventDefault();
        store.setCurrentFloor(store.state.currentFloor + 1);
        renderer.render('all');
        break;
      case 'PageDown':
        event.preventDefault();
        store.setCurrentFloor(store.state.currentFloor - 1);
        renderer.render('all');
        break;

      case '+':
        event.preventDefault();
        store.setBrushSize(store.state.brushSize + 1);
        renderer.render('current');
        break;
      case '-':
        event.preventDefault();
        store.setBrushSize(store.state.brushSize - 1);
        renderer.render('current');
        break;

      case 'Shift':
        store.state.shiftDown = true;
        break;

      case 'Delete':
        event.preventDefault();
        if (store.state.highlightedItem) {
          const { x, y, z } = store.state.highlightedItem;
          store.eraseOnTile(x, y, z);
          store.clearHighlight();
        } else {
          store.eraseOnTile(store.state.cursorPosition.x, store.state.cursorPosition.y, store.state.currentFloor);
        }
        renderer.render('current');
        break;

      default:
        break;
    }
  }

  function handleKeyUp(event) {
    if (event.key === 'Shift') {
      event.preventDefault();
      store.state.shiftDown = false;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      store.state.tabDown = false;
      store.selectTool('brush');
      renderer.render('current');
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  });
}
