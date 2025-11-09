# План: n8n нода «Redis Cache»

## Цель
Создать n8n-ноду для кэширования данных в Redis с двумя режимами работы — запись и чтение. Нода должна быть простой, надёжной и соответствовать стандартам проекта и n8n community nodes.

## Архитектура и подход
- **UI режим**: `mode` — options: `write` | `read` (селект).
- **Соединение с Redis**: одно подключение на запуск `execute`, корректное закрытие в `finally`.
- **Креды**: отдельный тип credentials для Redis (host, port, username, password, tls, db).
- **Сериализация**: запись принимает JSON-данные как объект, массив или примитив и сериализует в строку (валидация JSON). Чтение парсит строку обратно в объект при выдаче.
- **TTL**: задаётся числом и единицей измерения (сек/мин/часы (по умолчанию)/дни). На перезаписи TTL обновляется (используем `SET` с `EX`).
- **Обработка ошибок**: понятные сообщения через `NodeOperationError`, опция `continueOnFail` поддерживается.

## UI-параметры ноды
- **Mode** (`mode`, options):
  - `write`
  - `read`
- **Key** (`key`, string, required): отображается для обоих режимов.
- Для режима `write` (отображается по `displayOptions.show.mode = ['write']`):
  - **Data (JSON)** (`data`, required): данные, которые будут потом сериализованы в JSON-строку.
  - **TTL Value** (`ttl`, number, optional, 0 = без TTL).
  - **TTL Unit** (`ttlUnit`, options, default: `seconds`): `seconds` | `minutes` | `hours` | `days`.

## Креды Redis (`Redis`)
- **Host** (`host`, string, required, default: `localhost`).
- **Port** (`port`, number, required, default: `6379`).
- **Username** (`username`, string, optional).
- **Password** (`password`, string, optional, password: true).
- **TLS** (`tls`, boolean, default: `false`).
- **DB Index** (`db`, number, default: `0`).

Аутентификация и конфиг будут формироваться на базе этих полей. При `tls = true` включаем безопасное соединение.

## Логика: режим «Записать» (write)
- Получить `key`, `data` (string с JSON), `ttl`, `ttlUnit`.
- Провалидировать `key` (не пустой). Сериализовать
- Конвертировать TTL в секунды по таблице:
  - seconds: `ttl`
  - minutes: `ttl * 60`
  - hours: `ttl * 3600`
  - days: `ttl * 86400`
- Выполнить `SET key value` с опцией EX (только если ttl > 0), иначе обычный `SET`.
- Возвращаемый результат (рекомендация): `{ ok: true, key, ttlSeconds }`.
- Ошибки подключения/установки значения — через `NodeOperationError`.

## Логика: режим «Считать» (read)
- Получить `key`.
- Выполнить `GET key`.
- Если значение отсутствует — вернуть `{ found: false, key }` (не ошибка, чтобы не ломать поток).
- Если строка найдена — попытаться `JSON.parse`. При невалидной строке — вернуть ошибку (данные повреждены/не JSON).
- Возвращаемый результат: распарсенный объект, например `{ found: true, key, value: <object> }`.

## Обработка ошибок
- Валидация входа: пустой ключ, невалидный JSON, отрицательный TTL.
- Проблемы подключения/аутентификации Redis, таймауты.
- При `continueOnFail()` — возвращать `{ error: message }` в `json` текущего айтема.

## Зависимости
- Библиотека Redis: `redis` (node-redis v4). Причины:
  - Официальный клиент, удобный API `set(key, value, { EX: seconds })`.
  - Достаточно для одиночного инстанса/простого кэширования.

## Структура проекта
- `credentials/Redis.credentials.ts` — описание кредов.
- `nodes/RedisCache/RedisCache.node.ts` — основная нода.
- `nodes/RedisCache/redisClient.ts` — хелпер для подключения (инкапсулировать создание клиента, коннект/дисконнект, options).
- `package.json` — обновить секции `n8n.nodes` и `n8n.credentials` на новые файлы (`dist/...`).
- `docs/CHANGELOG.md` — добавить запись о новой ноде.
- `README.md` — добавить краткое руководство по установке и примерам.

## Реализация клиента Redis
- Создаём клиент один раз на запуск `execute` для всех айтемов.
- Конфиг из кредов: host, port, username, password, tls, db.
- Подключение в `try`/`finally`, закрытие соединения в `finally`.
- Лёгкий ретрай на старт (1 попытка повторно) — опционально.

## Возвращаемые данные
- Write: `{ ok: true, key, ttlSeconds }`.
- Read (miss): `{ found: false, key }`.
- Read (hit): `{ found: true, key, value: <parsed JSON> }`.

## Тестирование (минимум)
- Юнит-тесты хелпера TTL-конверсии (s/min/h/d).
- Валидация JSON (валидный/невалидный).
- Поведение read: miss/hit, parse error.
- Поведение write: без TTL и с TTL, обновление TTL при перезаписи.

## Сборка и запуск
- `pnpm i` (в корне репо, зависимости для ноды ставятся локально в пакете).
- `pnpm build` или `pnpm dev` в папке ноды.
- Локальная проверка через `n8n-node dev` и ноду в редакторе n8n.

## Этапы работ (TODO)
1. Создать креды `Redis.credentials.ts` (host/port/username/password/tls/db).
2. Создать ноду `RedisCache.node.ts` с UI: mode, key, data (write), ttl, ttlUnit.
3. Реализовать хелпер `redisClient.ts` и подключение в `execute`.
4. Реализовать режим `write` (SET с EX) и режим `read` (GET + parse).
5. Обработка ошибок и `continueOnFail`.
6. Обновить `package.json` (секция `n8n.nodes`/`n8n.credentials`).
7. Добавить базовые тесты (unit) и инструкции в README.
8. Обновить `docs/CHANGELOG.md`.
