# Vue 3 + Vite

Testowane na node v16.13.0 (npm v8.1.0)

### TODO

- Jeśli `Tile` jest tym samym co `Stack` to ujednolicić.
- Używanie przedmiotów z Inventory
- Obsługa `quantity` przy `moveItem()`

### Kontrakty

#### MoveItem
Podnoszenie, upuszczanie, przekładanie w ekwipunku oraz przemieszczanie po mapie.

```json
{
  "event": "MoveItem",
  "params": {
    "action": "swap", // string ["move"/"pickup"/"drop"/"swap"]
    "itemId": 1, // int
    "quantity": 1, // int
    "from": {
      "type": "floor", // string ("floor" / "inventory")
      "data": 1 // object|int (Position / SlotId)
    },
    "to": {
      "type": "floor", // string (floor/inventory)
      "data": 2 // object|int|null (Position / SlotId)
    }
  }
}
```
