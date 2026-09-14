# jsme – JS Map Editor

Edytor map kafelkowych (Vue 3 + WebGL) bez kroku budowania: wystarczy
serwer statyczny (`python3 -m http.server`) i otwarcie `index.html`.
Moduły ES ładują się bezpośrednio w przeglądarce.

Docelowo to zestaw edytorów (mapy, przedmiotów, creatures, efektów,
skryptów) przełączanych railem po lewej stronie, ze wspólnym paskiem menu
(File) nad nimi. Działają edytor map i edytor itemów; creatures, effects i
scripts to na razie puste miejsca w railu.

## Architektura

Dane płyną w jedną stronę:

```
UI / klawiatura  →  actions.js / tools.js  →  store.js  →  renderer.js
```

| Plik | Rola |
| --- | --- |
| `config.js` | Stałe edytora (URL katalogu itemów, mapy startowej i wzorców terenu, rozmiar kafelka, maks. wysokość stosu, zakres pięter). Leży obok `index.html`, a nie w `src/`, bo to plik do ręcznej edycji przy wdrożeniu. |
| `src/editor.js` | Singleton edytora map: tworzy store, narzędzia, akcje i renderer, z których korzystają komponenty. |
| `src/core/editors.js` | Lista edytorów w railu (`EDITORS`) i stan workspace: który edytor jest aktywny. |
| `src/core/mapData.js` | Czysty model mapy (piętro → wiersz → kolumna → stos wpisów) i operacje blokowe. Bez wiedzy o UI. |
| `src/core/catalog.js` | Ładowanie katalogu itemów; indeks `Map` po id i podział na warstwy. |
| `src/core/terrains.js` | Wzorce terenu: model wzorca (ground + 8 krawędzi zewnętrznych + 4 wewnętrzne) i czysta reguła `borderPlan()`, która dla jednego kafelka wybiera pasujące kawałki. |
| `src/core/store.js` | Reaktywny stan UI + reguły edycji nad `mapData`. Każda mutacja mapy podbija `state.mapRevision` i jest rejestrowana w historii. |
| `src/core/history.js` | Cofnij/powtórz: zapamiętuje zawartość kafelków sprzed zmiany; krok = jeden gest myszy albo jedna akcja. |
| `src/core/tools.js` | Narzędzia (pointer, select, brush, eraser, sampler): reakcja na mysz i rysowanie HUD. |
| `src/core/actions.js` | Rejestr komend edytora map (`edit.copy`, `view.zoomIn`, …) z etykietą, skrótem, ikoną i `run()`. |
| `src/core/workspaceActions.js` | Komendy wspólne dla wszystkich edytorów – menu File (`file.save`, `help.shortcuts`, …), ten sam kształt co w `actions.js`. |
| `src/core/menus.js` | Definicja paska menu (id z `workspaceActions.js`) i przycisków akcji na pasku narzędzi mapy (id z `actions.js`). |
| `src/core/shortcuts.js` | Notacja skrótów klawiszowych: normalizacja, dopasowanie do `KeyboardEvent`, format do wyświetlenia. |
| `src/core/mapFile.js` | Envelope pliku mapy `{ name, respawnPoint, map }`, walidacja i odczyt/zapis. |
| `src/core/itemsFile.js` | To samo dla `items.json`: serializacja katalogu i wczytanie PNG na sprite itemu. |
| `src/core/terrainsFile.js` | To samo dla `terrains.json`: serializacja wzorców i ich pobranie z serwera. Plik jest opcjonalny — jego brak znaczy „zero wzorców”, nie błąd. |
| `src/core/browserFiles.js` | Dwa gesty przeglądarki, z których korzystają oba powyższe: `pickFile()` i `downloadText()`. Jedyne miejsce, które dotyka `<input type=file>` i `<a download>`. |
| `src/core/renderer.js` | Renderer WebGL. Obserwuje store i sam planuje klatkę (`requestAnimationFrame`). |
| `src/core/painter.js` | Warstwa WebGL z API w stylu Canvas 2D (batching, atlas tekstur, warstwy offscreen). |
| `src/core/pointer.js` | Matematyka piksel ↔ kafelek z uwzględnieniem paralaksy pięter. |
| `src/components/App.js` | Powłoka workspace: `MenuBar` nad wszystkim, `EditorRail` + aktywny edytor (`EDITOR_COMPONENTS`; brak wpisu = `EmptyEditor`), dialogi z paska menu (`DIALOGS`: help, projectProperties, newProject), skróty File. |
| `src/components/MapEditor.js` | Edytor map w całości: `Sidebar`, `Toolbar`, `MapCanvas`, własne dialogi (`DIALOGS`: itemProperties, terrains), skróty mapy. |
| `src/components/TerrainsModal.js` | Okno „Terrain patterns” (T): lista wzorców, siatka 3×3 z groundem w środku, siatka 2×2 narożników wewnętrznych i wbudowany picker itemów. |
| `src/components/` | Pozostałe komponenty Vue: `MenuBar`, `Toolbar`, `Sidebar`, `Palette`, `MapCanvas`, dialogi. Wspólne kawałki: `Modal` (ramka każdego dialogu — overlay, przeciągany nagłówek, zamykanie), `DialogHost` (renderuje dialog wskazany przez `state.dialog`), `ItemGrid` (siatka sprite'ów dla palety, listy itemów i pickera we wzorcach terenu), `ProjectFormFields` (pola nazwy i respawn pointu). |
| `src/composables/` | `useKeyboard` (ogólne: skróty rejestru akcji → klawiatura), `useWorkspaceKeyboard` (skróty File + Escape zamykający dialog), `useMapKeyboard` (skróty edytora map + tryby Shift/Tab), `useDraggable` (przeciąganie okien), `useProjectForm` (walidowany draft nazwy i respawn pointu dla obu dialogów projektu). |

Warstwy nad rendererem to fabryki domknięć (`createStore`, `createTools`,
`createActions`), a sam rendering to klasy (`MapRenderer`, `GLPainter`,
`Layer`) — bo to jedyna imperatywna część z własnym cyklem życia zasobów GPU
(`attach`/`detach`, kontekst tracony i odzyskiwany).

Nikt poza rendererem nie woła „odśwież”. Store zaznacza zmienione piętra
(`touchFloor`), renderer obserwuje `mapRevision` oraz pola stanu wpływające
na widok i skleja wszystkie żądania z jednej klatki w jeden render.

Edytory montują się pojedynczo: przełączenie w railu odmontowuje bieżący
edytor razem z jego nasłuchem klawiatury, więc skróty są per edytor i
nigdy nie nachodzą na siebie. Jedyne skróty globalne to te z menu File
(`workspaceActions.js`); `editor.js` sprawdza przy starcie, że żaden
edytor ich nie powtarza.

## Jak rozbudować

- **Nowy edytor** – wpis `{ id, label, icon }` w `EDITORS` (`core/editors.js`), ikona w `app.css`
  jako `.rail-icon[data-icon='id']`, komponent w `EDITOR_COMPONENTS` w `App.js`. Skróty edytora
  podpina jego komponent-korzeń przez `useKeyboardShortcuts(akcje, { keydown?, keyup? })`.
- **Nowa komenda** – dodaj wpis `define('grupa.nazwa', { label, shortcut?, icon?, enabled?, run })`
  w `actions.js` (komenda mapy) albo `workspaceActions.js` (wspólna, dostępna w każdym edytorze).
  Skrót od razu działa z klawiatury i pojawia się w oknie Help.
- **Pozycja w menu** – dopisz id akcji z `workspaceActions.js` do listy w `menus.js` (`null` = separator).
  Nowe menu to nowy obiekt w `MENUS`; pasek menu jest wspólny, więc menu specyficzne dla jednego
  edytora tam nie należy.
- **Nowe narzędzie** – dodaj obiekt w `tools.js` (`name`, `title`, `shortcut`, `sizing`,
  `cursor`, `onClick/onDragStart/onDrag/onRelease/onRender`). Pasek narzędzi, skrót i Help
  podpinają się same; ikonę dodaj w `app.css` jako `.ui-icon[data-icon='nazwa']`.
- **Nowy dialog** – komponent owinięty w `<Modal title="…">` + wpis w `DIALOGS` w `MapEditor.js`
  (dialog mapy) albo w `App.js` (dialog z menu File, widoczny w każdym edytorze); otwieranie przez
  `store.openDialog('nazwa', props)`.
- **Nowa mutacja mapy** – funkcja w `store.js`, która przed zmianą woła `recordTile(x, y, z)`
  (to daje cofnij/powtórz), po zmianie `touchFloor(z)` (lub `touchAll()`), i eksport
  w zwracanym obiekcie. Mutacje z jednej akcji same składają się w jeden krok historii;
  gest myszy spina `beginGesture()`/`endGesture()` w `MapCanvas.js`.
- **Nowy wzorzec terenu** – nie w kodzie: okno „Terrain patterns” (T) w edytorze map,
  a wynik ląduje w `terrains.json` (przycisk „Save terrains.json” w tym oknie).
- **Przycisk akcji na pasku narzędzi** – dopisz id do `TOOLBAR_ACTIONS` w `menus.js`.
- **Nowy element HUD zależny od stanu** – dopisz pole do listy w `renderer.subscribe()`.

## Format pliku mapy

```json
{ "name": "Untitled", "respawnPoint": [100, 100, 0], "map": { … } }
```

`name` i `respawnPoint` edytuje się w oknie File → Properties….
`map` to `{ [z]: { [y]: { [x]: [ { id, ...właściwości }, … ] } } }`. `id` to numer
itemu z katalogu; pozostałe klucze wpisu to własne właściwości ustawione w
dialogu „Properties” (klucze normalizowane do camelCase). Po New/Open widok
centruje się na `respawnPoint` i przełącza na jego piętro.

Edytor startuje na mapie z `config.mapUrl` (`default-map.json` obok
`index.html`) — jej `name` i `respawnPoint` uzupełniają zarazem stare pliki
(goły obiekt `map`, bez envelope). Gdy pliku nie da się wczytać, edytor
startuje na pustej mapie bez nazwy (błąd trafia do konsoli).

Nowy projekt zakłada się z dropdownu projektu w pasku menu (pod listą „Recent
projects”): „New project” otwiera dialog z nazwą i respawn pointem (domyślnie
„Untitled” i 100/100/0, stała `NEW_PROJECT` w `NewProjectModal.js`), a dopiero
przycisk „Create new project” przełącza aplikację — `store.createProject()`
wczytuje `items.json` i `terrains.json` od nowa, czyści mapę, ustawia nazwę
i centruje widok na nowym respawn poincie. Gdy katalog itemów się nie wczyta, bieżący projekt
zostaje nietknięty, a powód pokazuje się w dialogu.

## Katalog itemów (`items.json`)

Tablica wpisów `{ id, name, layer, elevation, traits, light, image }`. `image` to PNG w base64,
`layer` decyduje o zakładce w palecie i o tym, który wpis na kafelku zastępuje
pędzel. `elevation` to wysokość itemu w px: każdy wpis leżący wyżej na stosie
kafelka jest rysowany przesunięty w górę i w lewo o sumę `elevation` wpisów pod
nim (`store.stackElevation`), więc np. skrzynia o wysokości 8 „unosi” to, co na
niej stoi. Suma jest przycinana do `config.maxElevation` (64 px). Renderer, podgląd pędzla i podgląd przenoszenia zaznaczenia liczą
to tak samo.

Po wczytaniu `image` z pliku rozkłada się w katalogu na trzy pola, żeby
każda nazwa znaczyła jedną rzecz: `png` (to samo base64, do zapisu z
powrotem), `src` (data URL dla `<img>`) i `bitmap` (zdekodowany `Image`,
którym rysuje renderer).

`traits` to flagi z `ITEM_TRAITS` (`ground`, `floor`, `blocking`, `movable`,
`pickupable`, `stackable`); nieznane są odrzucane przy wczytaniu. Jedyną, na
którą reaguje sam edytor, jest `ground`: taki item ląduje na spodzie stosu
kafelka (`store.pushEntry`), a gumka 1×1 go nie zdejmuje — usuwa go dopiero
gumka większa niż 1 (czyści cały kafelek), „Delete” z menu kontekstowego albo
klawisz Delete na zaznaczeniu (czyści cały zaznaczony obszar). Reszta jedzie
do pliku dla gry.

`light` to źródło światła itemu: `null`, gdy item nie świeci, albo
`{ level, color }` — zasięg w kafelkach (1–`config.maxLightLevel`) i barwa jako
hex `#rrggbb`. Edytor itemów tylko to zapisuje; samo światło nie jest nigdzie
rysowane — pole jest dla gry czytającej katalog.

## Wzorce terenu (`terrains.json`)

Wzorzec terenu to item ziemi plus sprite'y jego krawędzi: pędzel maluje sam
ground, a krawędzie dokładają się same. Wzorców może być dowolnie wiele
(trawa, woda, …) — każdy rozpoznawany po swoim itemie ziemi, więc „malowanie
wzorcem” to po prostu wybranie tego itemu w palecie (panel nad paletą oznacza
go wtedy plakietką `terrain`).

Jeden wzorzec to 13 itemów: ziemia, 8 krawędzi zewnętrznych (pierścień wokół
prostokątnej łaty: 4 boki i 4 narożniki wypukłe) i 4 krawędzie wewnętrzne
(narożniki wklęsłe, gdy teren opływa kafelek z dwóch stron). Każdy slot nazywa
się od tego, **gdzie leży względem terenu** — dokładnie tak, jak rozkłada je
okno „Terrain patterns” (T):

```
 nw   n   ne          wewnętrzne:   nw  ne
  w  GND   e                        sw  se
 sw   s   se
```

Kawałek nigdy nie ląduje na kafelku terenu, tylko na sąsiedzie, który ten teren
obramowuje — nad jego ziemią, pod tym, co na niej stoi. Czyli `outer.n` to item
dla kafelka na północ od terenu, a `inner.nw` dla kafelka, który ma teren od
południa **i** od wschodu. Pusty slot wewnętrzny podmienia się na dwie krawędzie
proste, które by zastąpił, więc niedokończony wzorzec też maluje coś sensownego.

Krawędzie nie są nigdzie zapamiętane jako „krawędzie” — wynikają z tego, które
kafelki niosą ziemię wzorca, i są przeliczane wokół każdego pociągnięcia pędzla.
Dlatego postawienie kawałka oznacza zarazem skasowanie tych, które przestały
pasować, a kafelek zawsze dostaje swój komplet naraz (`store.refreshTerrainsAround`).
Gumka działa tak samo, ale tylko gdy zdejmie ziemię wzorca: skasowany ręcznie
kawałek krawędzi zostaje skasowany, a nie wraca w tej samej chwili.

Plik: tablica wpisów `{ id, name, groundId, outer, inner }`, gdzie `outer`
i `inner` to mapy slot → id itemu (`null` = pusty). Jest opcjonalny — bez niego
edytor startuje bez wzorców, a pędzel zachowuje się jak dawniej. Jak `items.json`
leży obok `index.html` i zapisuje się go pobraniem („Save terrains.json”), po czym
podmienia się plik na dysku.

## Testy

```
npm test        # node --test, bez instalowania czegokolwiek
npm run lint    # eslint (wymaga `npm install`)
npm run format  # prettier (wymaga `npm install`)
```

Testy nie potrzebują przeglądarki ani jsdom: `test/harness.mjs` podstawia tyle
przeglądarki, ile edytor naprawdę dotyka (`window`, `document.createElement`,
`Image`, `fetch`, `ResizeObserver`, `requestAnimationFrame`), a Vue montuje się
przez `createRenderer()` z mikroskopijnym wirtualnym DOM-em. Dzięki temu w
testach chodzą te same moduły, które ładuje przeglądarka.

`canvas.getContext()` zwraca w harnessie `null`, więc każdy przebieg testów
przechodzi zarazem ścieżkę „maszyna bez WebGL” — renderer zgłasza błąd,
a edytor działa dalej.

| Plik | Co pokrywa |
| --- | --- |
| `test/core.test.mjs` | Czyste moduły: `mapData`, `history`, `catalog`, `terrains`, `shortcuts`, `mapFile`, `pointer`. |
| `test/store.test.mjs` | Reguły edycji: stos kafelka i ground, pędzel vs warstwy, wzorce terenu i ich krawędzie, cofnij/powtórz i gesty, zaznaczenie i schowek, edycja katalogu. |
| `test/app.test.mjs` | Zamontowana aplikacja: render, rail, spójność rejestrów akcji, klawiatura (skróty mapy vs File, pisanie w polu, dialog). |
| `test/dialogs.test.mjs` | Wspólna ramka `Modal` dla wszystkich dialogów i walidacja `useProjectForm`. |
