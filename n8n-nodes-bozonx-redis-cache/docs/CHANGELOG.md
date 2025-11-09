# CHANGELOG

## 0.3.1 - Payload options and TTL UI

- Добавлен выбор типа payload: `JSON` или `Custom Fields` (пары ключ-значение преобразуются в JSON).
- Поле выбора единиц TTL (`TTL Unit`) перемещено выше значения TTL и по умолчанию установлено `hours`.

## 0.3.0 - Add Redis Cache node

- Добавлена нода Redis Cache с режимами `write` и `read`.
- Поддержка TTL в сек/мин/ч/д.
- Креды Redis (host, port, username, password, TLS, db).
- Запись/чтение JSON-значений (строка в Redis, парсинг при чтении).
