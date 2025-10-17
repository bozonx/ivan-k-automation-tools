# micro-stt

**Версия:** 0.8.2

Микросервис распознавания речи (STT) на NestJS + Fastify. Поддерживает синхронную транскрибацию аудио по URL через провайдера AssemblyAI.

## Возможности

- 🎯 Синхронная транскрибация аудио по URL
- 🔌 Поддержка нескольких STT провайдеров (в настоящее время: AssemblyAI)
- 📚 Полная OpenAPI/Swagger документация
- 🏥 Health check эндпоинты (Kubernetes-ready)
- 🔐 Централизованная обработка ошибок
- 📊 Структурированное логирование
- ⚡ Fastify для высокой производительности
- 🐳 Docker support

## Документация

- [Swagger API документация](docs/SWAGGER.md) - интерактивная документация API
- [История изменений](docs/CHANGELOG.md) - список всех версий и изменений

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

Сервис слушает хост/порт из переменных окружения `LISTEN_HOST` и `LISTEN_PORT` (по умолчанию `localhost:3000`). Глобальный префикс API формируется из `API_BASE_PATH` и `API_VERSION` (по умолчанию `api/v1`).

## Документация API

После запуска сервиса доступна интерактивная Swagger/OpenAPI документация:

```
http://localhost:3000/api/docs
```

Swagger UI предоставляет:

- Полное описание всех эндпоинтов
- Интерактивное тестирование API
- Примеры запросов и ответов
- Документацию всех возможных ошибок
- Экспорт спецификации OpenAPI в формате JSON: `http://localhost:3001/api/docs-json`

Подробнее см. [docs/SWAGGER.md](docs/SWAGGER.md).

## Переменные окружения

См. `.env.example`. Основные ключи:

- `ASSEMBLYAI_API_KEY` — API ключ провайдера AssemblyAI (если не передаётся в запросе).
- `STT_DEFAULT_PROVIDER` — провайдер по умолчанию (`assemblyai`).
- `STT_ALLOWED_PROVIDERS` — список разрешённых провайдеров (через запятую).
- `STT_MAX_FILE_SIZE_MB` — максимальный размер файла в МБ (проверяется по `Content-Length`, если доступен).
- `STT_REQUEST_TIMEOUT_SEC` — таймаут HTTP-запросов к провайдеру.
- `STT_POLL_INTERVAL_MS` — интервал опроса статуса задачи у провайдера.
- `STT_MAX_SYNC_WAIT_MIN` — максимальное время ожидания синхронного результата.
- `ALLOW_CUSTOM_API_KEY` — разрешить ли передавать свой ключ в теле запроса (true/false, по умолчанию `true`).
- `LOG_LEVEL` — уровень логирования (по умолчанию `warn`).
- `API_BASE_PATH` — базовый путь для всех эндпоинтов (по умолчанию `api`).
- `API_VERSION` — версия API (по умолчанию `v1`).

## Структура проекта

```
micro-stt/
├── src/
│   ├── common/          # Переиспользуемые компоненты
│   │   ├── constants/   # Константы и токены DI
│   │   ├── dto/         # Data Transfer Objects
│   │   ├── filters/     # Exception filters
│   │   └── interceptors/ # HTTP interceptors (логирование)
│   ├── config/          # Конфигурация (app, stt)
│   ├── modules/         # Бизнес-модули
│   │   ├── health/      # Health check эндпоинты
│   │   └── transcription/ # Транскрибация аудио
│   ├── providers/       # Внешние провайдеры (AssemblyAI)
│   ├── app.module.ts    # Корневой модуль
│   └── main.ts          # Entry point + Swagger setup
├── test/
│   ├── e2e/             # End-to-end тесты
│   ├── unit/            # Unit тесты
│   └── setup/           # Тестовые setup файлы
└── docs/                # Документация
    ├── CHANGELOG.md     # История изменений
    └── SWAGGER.md       # Руководство по Swagger
```

## Тесты

```bash
pnpm test
```

### E2E тесты

- Размещаются в `test/e2e/`.
- Запуск вместе с unit-тестами:

```bash
pnpm test
```

- Пример: `test/e2e/health.e2e-spec.ts` использует Fastify `inject` и поднимает приложение в памяти через фабрику `test/e2e/test-app.factory.ts`, повторяя глобальные пайпы и префиксы из `src/main.ts`.

## Docker

Сборка и запуск:

```bash
docker compose up --build
```

## Эндпоинты

### Index

- `GET /{API_BASE_PATH}/{API_VERSION}` — индекс API (по умолчанию: `GET /api/v1`). Возвращает JSON:

```json
{
  "name": "micro-stt",
  "version": "0.8.2",
  "status": "ok",
  "time": "2025-10-17T10:00:00Z",
  "links": {
    "self": "/api/v1",
    "docs": "/api/docs",
    "health": "/api/v1/health",
    "transcriptions": "/api/v1/transcriptions"
  }
}
```

### Health Checks

- `GET /health` — полная проверка здоровья сервиса
- `GET /health/ready` — проверка готовности (readiness probe для Kubernetes)
- `GET /health/live` — проверка работоспособности (liveness probe для Kubernetes)

Пример ответа:

```json
{
  "status": "ok",
  "info": { "service": { "status": "up" } },
  "error": {},
  "details": { "service": { "status": "up" } }
}
```

### Транскрибация

- `POST /{API_BASE_PATH}/{API_VERSION}/transcriptions/file` — синхронная транскрибация файла по URL (не стрим). По умолчанию: `POST /api/v1/transcriptions/file`.

Тело запроса:

```json
{
  "audioUrl": "https://example.com/audio.mp3",
  "provider": "assemblyai", // опционально, по умолчанию assemblyai
  "timestamps": false, // опционально, включить временные метки
  "apiKey": "your-api-key" // опционально, перезапись ключа
}
```

Ответ 200:

```json
{
  "text": "Транскрибированный текст из аудиофайла...",
  "provider": "assemblyai",
  "requestId": "abc123-def456-ghi789",
  "durationSec": 123.45,
  "language": "en",
  "confidenceAvg": 0.92,
  "wordsCount": 204,
  "processingMs": 8421,
  "timestampsEnabled": false
}
```

> 💡 **Совет:** Полную документацию API с интерактивными примерами смотрите в Swagger UI: `http://localhost:3001/api/docs`

### Примеры запросов

```bash
curl -X POST \
  http://localhost:3001/${API_BASE_PATH:-api}/${API_VERSION:-v1}/transcriptions/file \
  -H 'Content-Type: application/json' \
  -d '{
    "audioUrl": "https://example.com/audio.mp3"
  }'
```

С пользовательским API ключом (если `ALLOW_CUSTOM_API_KEY=true`):

```bash
curl -X POST \
  http://localhost:3001/${API_BASE_PATH:-api}/${API_VERSION:-v1}/transcriptions/file \
  -H 'Content-Type: application/json' \
  -d '{
    "audioUrl": "https://example.com/audio.mp3",
    "apiKey": "YOUR_ASSEMBLYAI_KEY"
  }'
```

### Коды ответов

- `200 OK` — транскрибация выполнена успешно
- `400 Bad Request` — ошибки валидации (невалидный URL/провайдер, файл слишком большой, приватный хост и т.п.)
- `401 Unauthorized` — отсутствует API ключ провайдера
- `503 Service Unavailable` — сервис транскрибации недоступен или ошибка провайдера
- `504 Gateway Timeout` — превышено время ожидания транскрибации (`TRANSCRIPTION_TIMEOUT`)

> 💡 Все ошибки имеют унифицированный формат с подробным описанием. Примеры смотрите в [Swagger документации](http://localhost:3001/api/docs).

### Ограничения и примечания

- Это синхронная операция: HTTP-запрос блокируется до завершения распознавания или таймаута.
- Базовая защита от SSRF: разрешены только `http`/`https`, запрещены `localhost`/`127.0.0.1`/`::1`.
- Проверка размера файла выполняется только если источник отдаёт заголовок `Content-Length`.
