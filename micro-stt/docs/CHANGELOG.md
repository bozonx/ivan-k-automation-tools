# Changelog

## 0.1.0

- Scaffolded from `micro-file-cache`
- Added minimal NestJS app
- Implemented initial test endpoint
- Added unit test for controller
- Added Dockerfile and docker-compose.yml
- Added env example

## 0.2.0

### Added

- Синхронный REST эндпоинт `POST /api/v1/transcriptions/file` для транскрибации аудио по URL через AssemblyAI

## 0.3.0

### Changed

- Удалён тестовый эндпоинт `/test`

### Added

- Эндпоинт `GET /heartbeat` для проверки доступности сервиса

## 0.4.0

### Changed

- Переименована переменная окружения `STT_MAX_FILE_MB` → `STT_MAX_FILE_SIZE_MB`
- Значение по умолчанию для `ALLOW_CUSTOM_API_KEY` изменено на `true`
- Значение по умолчанию для `LISTEN_HOST` изменено на `localhost`
- Значение по умолчанию для `NODE_ENV` изменено на `production`
- Значение по умолчанию для `LOG_LEVEL` изменено на `warn`
