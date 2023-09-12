Testowane na node v16.13.0 (npm v8.1.0)

### TODO

- Klasę Hero zastąpić globalną funkcją hero() zwracającą Creature
- Mouse buttons - isDown -> isPressed
- Obiekt z position zawsze powinien zawierać tylko "x" i "y", dodatkowe pola jako osobne position, np:
    ```
    Mouse.position = {
      server: {x, y},
      client: {x, y},
      local: {x, y},
    }
    ```
  tak, żeby w przyszłości można było zamienić na `IPosition`
