# Vue 3 + Vite + TypeScript

Testowane na node v16.13.0 (npm v8.1.0)

### TODO

- Jeśli `Tile` jest tym samym co `Stack` to ujednolicić.

### Kontrakty

#### MoveItem
Podnoszenie, upuszczanie, przekładanie w ekwipunku oraz przemieszczanie po mapie.

```json
{
  "event": "MoveItem",
  "params": {
    "action": string, // "move" | "pickup" | "drop" | "swap"
    "itemId": int,
    "quantity": int,
    "fromPosition": ?IPosition,
    "fromSlot": ?int,
    "toPosition": ?IPosition,
    "toSlot": ?int
  }
}
```
