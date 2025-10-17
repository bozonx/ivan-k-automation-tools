# micro-stt

Микросервис распознавания речи (STT) на NestJS + Fastify. Поддерживает синхронную транскрибацию аудио по URL через провайдера AssemblyAI.

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

Сервис слушает хост/порт из переменных окружения `LISTEN_HOST` и `LISTEN_PORT` (по умолчанию `localhost:3001`). Глобальный префикс API формируется из `API_BASE_PATH` и `API_VERSION` (по умолчанию `api/v1`).

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

- `GET /heartbeat` — проверка доступности сервиса (без префикса, т.е. `/heartbeat`).

Пример ответа:

```
{
  "status": "ok",
  "uptime": 12345,
  "version": "0.1.0"
}
```

- `POST /{API_BASE_PATH}/{API_VERSION}/transcriptions/file` — синхронная транскрибация файла по URL (не стрим). По умолчанию: `POST /api/v1/transcriptions/file`.

Тело запроса:

```
{
  "audioUrl": "https://.../audio.mp3",
  "provider": "assemblyai", // опционально
  "timestamps": false,       // заглушка, пока не реализовано
  "apiKey": "..."           // опционально, перезапись ключа
}
```

Ответ 200:

```
{
  "text": "...",
  "provider": "assemblyai",
  "requestId": "prov-req-id",
  "durationSec": 123.45,
  "language": "en",
  "confidenceAvg": 0.92,
  "wordsCount": 204,
  "processingMs": 8421,
  "timestampsEnabled": false
}
```

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

### Ошибки

- `400 Bad Request` — ошибки валидации (невалидный URL/провайдер, файл слишком большой и т.п.).
- `401 Unauthorized` — отсутствует API ключ провайдера.
- `408/504` — `TRANSCRIPTION_TIMEOUT` по превышению лимита ожидания.
- `502 Bad Gateway` — ошибка со стороны провайдера.

### Ограничения и примечания

- Это синхронная операция: HTTP-запрос блокируется до завершения распознавания или таймаута.
- Базовая защита от SSRF: разрешены только `http`/`https`, запрещены `localhost`/`127.0.0.1`/`::1`.
- Проверка размера файла выполняется только если источник отдаёт заголовок `Content-Length`.
