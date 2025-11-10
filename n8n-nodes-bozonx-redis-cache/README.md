# n8n Node: Redis Cache

Community node для n8n для кэширования данных в Redis: запись/чтение JSON-значений с опциональным TTL.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

Sections:

- [Installation](#installation)
- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Parameters](#parameters)
- [Credentials](#credentials)
- [Advanced](#advanced)
- [Ошибки и Continue On Fail](#ошибки-и-continue-on-fail)
- [Compatibility](#compatibility)
- [Resources](#resources)
- [Dev](#dev)

## Installation

Follow the official community nodes installation guide: https://docs.n8n.io/integrations/community-nodes/installation/

## Quick start

1. Настройте креды `Redis`.
   - Host: `{{$env.REDIS_HOST}}` (пример)
   - Password: `{{$env.REDIS_PASSWORD}}` (пример)
2. Запись (Write):
   - Mode: `Write`
   - Key: `cache:hello`
   - Payload Type: `JSON`
   - Data (JSON): `{ "msg": "world" }`
   - TTL Unit: `hours`, TTL Value: `1` (или `0` для бесконечного)
   - Результат: `{ "ok": true, "key": "cache:hello", "ttlSeconds": 3600 }`
3. Чтение (Read):
   - Mode: `Read`
   - Key: `cache:hello`
   - Результат при попадании: `{ "found": true, "key": "cache:hello", "value": { "msg": "world" } }`
   - Результат при промахе: `{ "found": false, "key": "cache:hello" }`

## How it works

- Режимы:
  - `Write` — записывает строку JSON по ключу. При `ttl > 0` устанавливается срок жизни ключа.
  - `Read` — читает значение по ключу и пытается распарсить как JSON.
- Хранение: в Redis сохраняется строка JSON. При чтении выполняется `JSON.parse`.
- Возвращаемые данные:
  - Write: `{ ok: true, key, ttlSeconds }`
  - Read (miss): `{ found: false, key }`
  - Read (hit): `{ found: true, key, value: <object> }`

## Parameters

- **Mode** (options)
  Выбор режима ноды: `Write` или `Read`. По умолчанию — `Write`.

- **Key** (string, required)
  Ключ в Redis, под которым сохраняется/читается значение, например `cache:my-key`.

- Для режима `Write`:
  - **Payload Type** (options)
    Источник данных для записи:
    - `JSON` — введите строку с корректным JSON в поле "Data (JSON)". Пример: `{ "foo": "bar" }`.
    - `Custom Fields` — добавьте произвольные пары ключ-значение в коллекции "Fields"; они будут преобразованы в JSON-объект.
  - **Data (JSON)** (string, required при `Payload Type = JSON`)
    Строка с корректным JSON.
  - **Fields** (fixedCollection, multiple)
    Набор полей, собираемый в JSON-объект при записи. Поддерживаемые типы значения:
    - `String` — ввод в поле "String Value".
    - `Number` — ввод в поле "Number Value".
    - `Boolean` — ввод в поле "Boolean Value".
    - `Null` — значение будет `null`.
    - `JSON` — ввод валидного JSON в поле "JSON Value" (парсится в объект/массив/примитив).
  - **TTL Unit** (options)
    Единицы измерения TTL: `seconds`, `minutes`, `hours`, `days`. По умолчанию — `hours`.
  - **TTL Value** (number)
    Числовое значение TTL. `0` — без срока жизни.

## Credentials

Используются креды `Redis`:

- **Host** — имя хоста или IP (по умолчанию `localhost`).
- **Port** — TCP-порт Redis (по умолчанию `6379`).
- **Username** — ACL-пользователь (опционально).
- **Password** — пароль (опционально).
- **TLS** — включение TLS/SSL (boolean).
- **DB Index** — индекс базы (по умолчанию `0`).

Можно использовать выражения и переменные окружения, например:

- Host: `{{$env.REDIS_HOST}}`
- Password: `{{$env.REDIS_PASSWORD}}`

## Advanced

- Поддерживается настройка ноды **Continue On Fail** — при ошибке айтем вернёт `{ "error": "..." }`, и обработка продолжится для остальных.
- Одно подключение к Redis создаётся на запуск `execute` и закрывается после обработки всех айтемов.
- При записи `ttl > 0` используется `SET key value EX <seconds>`, иначе — обычный `SET`.

## Ошибки и Continue On Fail

Нода валидирует ввод и может генерировать ошибки. Примеры ситуаций:

- Невалидный JSON в поле `Data (JSON)` — ошибка: `Invalid JSON provided in Data`.
- Невалидный JSON в `JSON Value` для Custom Fields — ошибка: `Invalid JSON for field "<key>"`.
- Пустой ключ поля в Custom Fields — ошибка: `Field key must not be empty`.
- Невалидное число в Custom Fields (тип `Number`) — ошибка: `Invalid number for field "<key>"`.
- При чтении обнаружено не-JSON значение — ошибка: `Stored value is not valid JSON`.
- TTL < 0 — ошибка: `TTL must be >= 0`.

Если в настройках ноды включить **Continue On Fail**, то при ошибке айтем не прервёт весь запуск и вернёт структуру вида:

```json
{ "error": "<message>" }
```

Примечания:

- Параметр `TTL Value` имеет ограничение минимального значения `0` (значение `0` означает отсутствие срока жизни).
- В заголовке узла отображается подзаголовок вида `Write: cache:hello` — помогает различать режим и ключ прямо на канвасе.

## Compatibility

Built and tested with n8n `1.60.0+`.

## Resources

- n8n community nodes docs: https://docs.n8n.io/integrations/#community-nodes
- node-redis (официальный клиент): https://github.com/redis/node-redis

## Dev

- **Local scripts**
  - Install deps: `pnpm install`
  - Lint: `pnpm lint`
  - Build: `pnpm build`
  - Dev (watch): `pnpm dev` or `pnpm run build:watch`

- **Publish to npm (via pnpm)**
  1. Login to npm (once): `pnpm login`
  2. Bump version: `pnpm version patch` (or `minor`/`major`)
  3. Build artifacts: `pnpm build`
  4. Publish as public package: `pnpm publish --access public`
  5. Verify: `npm info n8n-nodes-bozonx-redis-cache`

- **Notes**
  - `prepublishOnly` runs `n8n-node prerelease` automatically before publishing.
  - If you use 2FA, the CLI will ask for a one-time code during `publish`.
  - Dry run: `pnpm publish --dry-run` to preview the package contents.
