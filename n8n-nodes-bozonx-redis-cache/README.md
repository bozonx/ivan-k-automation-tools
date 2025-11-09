# n8n Node: Redis Cache

Community node для n8n для кэширования данных в Redis: запись/чтение JSON-значений с опциональным TTL.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

Sections:

- [Installation](#installation)
- [How it works](#how-it-works)
- [Parameters](#parameters)
- [Credentials](#credentials)
- [Advanced](#advanced)
- [Compatibility](#compatibility)
- [Resources](#resources)

## Installation

Follow the official community nodes installation guide: https://docs.n8n.io/integrations/community-nodes/installation/

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
    Набор полей `key`/`value`, собираемый в JSON-объект при записи.
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

## Compatibility

Built and tested with n8n `1.60.0+`.

## Resources

- n8n community nodes docs: https://docs.n8n.io/integrations/#community-nodes
- node-redis (официальный клиент): https://github.com/redis/node-redis
