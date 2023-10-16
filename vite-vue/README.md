# Vue 3 + Vite

Testowane na node v16.13.0 (npm v8.1.0)

### TODO

- Używanie przedmiotów z Inventory
- Zamienić funkcje `pickUp()` `drop()` `moveItem()` `rearrangeItem()` na jedną `moveItem()` (emitować zawsze ten sam event, a obsługa skąd gdzie na backendzie)
- Obsługa `quantity` przy `moveItem()`

### Kontrakty

#### MoveItem
Podnoszenie, upuszczanie, przekładanie w ekwipunku oraz przemieszczanie po mapie.

```json
{
  "event": "MoveItem",
  "params": {
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
