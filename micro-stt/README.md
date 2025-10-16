# micro-stt

Микросервис распознавания речи (scaffold). На текущем этапе реализован один тестовый эндпоинт `GET /test`, который возвращает строку `hellow world` и покрыт unit-тестом.

## Требования

- Node.js 22+
- pnpm 10+

## Установка

```bash
pnpm install
```

## Запуск разработки

```bash
pnpm start:dev
```

Сервис слушает хост/порт из переменных окружения `LISTEN_HOST` и `LISTEN_PORT` (по умолчанию `0.0.0.0:3001`).

## Тесты

```bash
pnpm test
```

## Docker

Сборка и запуск:

```bash
docker compose up --build
```

## Эндпоинты

- `GET /test` — возвращает `hellow world`.
