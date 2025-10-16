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
