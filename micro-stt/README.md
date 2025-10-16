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
- `POST /api/v1/transcriptions/file` — синхронная транскрибация файла по URL (не стрим)

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
