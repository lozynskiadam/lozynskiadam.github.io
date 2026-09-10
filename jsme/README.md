# jsme – JS Map Editor

Edytor map kafelkowych (Vue 3 + WebGL) bez kroku budowania: wystarczy
serwer statyczny (`python3 -m http.server`) i otwarcie `index.html`.
Moduły ES ładują się bezpośrednio w przeglądarce.

## Architektura

Dane płyną w jedną stronę:

```
UI / klawiatura  →  actions.js / tools.js  →  store.js  →  renderer.js
```

| Plik | Rola |
| --- | --- |
| `config.js` | Stałe edytora (URL katalogu itemów, rozmiar kafelka, zakres pięter). |
| `src/editor.js` | Singleton: tworzy store, narzędzia, akcje i renderer, z których korzystają komponenty. |
| `src/core/mapData.js` | Czysty model mapy (piętro → wiersz → kolumna → stos wpisów) i operacje blokowe. Bez wiedzy o UI. |
| `src/core/catalog.js` | Ładowanie katalogu itemów; indeks `Map` po id i podział na warstwy. |
| `src/core/store.js` | Reaktywny stan UI + reguły edycji nad `mapData`. Każda mutacja mapy podbija `state.mapRevision` i jest rejestrowana w historii. |
| `src/core/history.js` | Cofnij/powtórz: zapamiętuje zawartość kafelków sprzed zmiany; krok = jeden gest myszy albo jedna akcja. |
| `src/core/tools.js` | Narzędzia (pointer, select, brush, eraser, sampler): reakcja na mysz i rysowanie HUD. |
| `src/core/actions.js` | Rejestr komend (`file.save`, `edit.copy`, …) z etykietą, skrótem, ikoną i `run()`. |
| `src/core/menus.js` | Definicja paska menu i przycisków akcji na pasku narzędzi jako listy id akcji. |
| `src/core/shortcuts.js` | Notacja skrótów klawiszowych: normalizacja, dopasowanie do `KeyboardEvent`, format do wyświetlenia. |
| `src/core/mapFile.js` | Otwieranie/zapis pliku mapy w przeglądarce, envelope `{ name, respawnPoint, map }` + walidacja. |
| `src/core/renderer.js` | Renderer WebGL. Obserwuje store i sam planuje klatkę (`requestAnimationFrame`). |
| `src/core/painter.js` | Warstwa WebGL z API w stylu Canvas 2D (batching, atlas tekstur, warstwy offscreen). |
| `src/core/pointer.js` | Matematyka piksel ↔ kafelek z uwzględnieniem paralaksy pięter. |
| `src/components/` | Komponenty Vue: `MenuBar`, `Toolbar`, `Sidebar`, `Palette`, `MapCanvas`, dialogi. |
| `src/composables/` | `useKeyboard` (mapuje skróty na akcje), `useDraggable` (przeciąganie okien). |

Nikt poza rendererem nie woła „odśwież”. Store zaznacza zmienione piętra
(`touchFloor`), renderer obserwuje `mapRevision` oraz pola stanu wpływające
na widok i skleja wszystkie żądania z jednej klatki w jeden render.

## Jak rozbudować

- **Nowa komenda** – dodaj wpis `define('grupa.nazwa', { label, shortcut?, icon?, enabled?, run })`
  w `actions.js`. Skrót od razu działa z klawiatury i pojawia się w oknie Help.
- **Pozycja w menu** – dopisz id akcji do listy w `menus.js` (`null` = separator).
  Nowe menu to nowy obiekt w `MENUS`.
- **Nowe narzędzie** – dodaj obiekt w `tools.js` (`name`, `title`, `shortcut`, `sizing`,
  `cursor`, `onClick/onDrag/onRelease/onRender`). Pasek narzędzi, skrót i Help
  podpinają się same; ikonę dodaj w `app.css` jako `.ui-icon[data-icon='nazwa']`.
- **Nowy dialog** – komponent + wpis w `DIALOGS` w `App.js`; otwieranie przez
  `store.openDialog('nazwa', props)`.
- **Nowa mutacja mapy** – funkcja w `store.js`, która przed zmianą woła `recordTile(x, y, z)`
  (to daje cofnij/powtórz), po zmianie `touchFloor(z)` (lub `touchAll()`), i eksport
  w zwracanym obiekcie. Mutacje z jednej akcji same składają się w jeden krok historii;
  gest myszy spina `beginGesture()`/`endGesture()` w `MapCanvas.js`.
- **Przycisk akcji na pasku narzędzi** – dopisz id do `TOOLBAR_ACTIONS` w `menus.js`.
- **Nowy element HUD zależny od stanu** – dopisz pole do listy w `renderer.subscribe()`.

## Format pliku mapy

```json
{ "name": "Untitled", "respawnPoint": [100, 100, 0], "map": { … } }
```

`map` to `{ [z]: { [y]: { [x]: [ { id, ...właściwości }, … ] } } }`. `id` to numer
itemu z katalogu; pozostałe klucze wpisu to własne właściwości ustawione w
dialogu „Properties” (klucze normalizowane do camelCase). Po New/Open widok
centruje się na `respawnPoint` i przełącza na jego piętro. Stare pliki (goły
obiekt `map`) nadal się otwierają z domyślnymi `name`/`respawnPoint` z `config.js`.
