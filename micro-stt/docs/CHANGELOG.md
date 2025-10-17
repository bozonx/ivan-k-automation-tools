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

## 0.5.0

### Added

- Переменные окружения `API_BASE_PATH` и `API_VERSION` для формирования глобального префикса API
- Глобальный префикс по умолчанию: `api/v1`
- Роут транскрибации переведён на контроллерный префикс: `POST /{API_BASE_PATH}/{API_VERSION}/transcriptions/file`
- Добавлены e2e тесты (Jest + Fastify inject): `test/e2e/health.e2e-spec.ts`
- Разделён тестовый setup на unit и e2e: `test/setup/unit.setup.ts`, `test/setup/e2e.setup.ts`; обновлены конфиги Jest и добавлен скрипт `test:e2e`

## 0.6.0

### Added

- **Централизованное логирование**: добавлен `Logger` во все сервисы (`TranscriptionService`, `AssemblyAiProvider`) с различными уровнями (log, debug, warn, error)
- **HTTP запросы логирование**: реализован `LoggingInterceptor` для автоматического логирования всех входящих HTTP запросов и ответов с измерением времени выполнения
- Логирование в `main.ts` при старте приложения с отображением конфигурации (адрес, порт, окружение, уровень логов)

### Changed

- **Рефакторинг конфигурации**: все модули конфигурации переведены на `registerAs` с namespaced подходом
  - `app.config.ts` с интерфейсом `AppConfig` (port, host, apiBasePath, apiVersion, nodeEnv, logLevel)
  - `stt.config.ts` с интерфейсом `SttConfig` (все STT-специфичные настройки)
- Конфигурация теперь загружается через `ConfigModule.load([appConfig, sttConfig])`
- `TranscriptionService` и `AssemblyAiProvider` используют `ConfigService` вместо прямого доступа к `process.env`
- `LoggingInterceptor` зарегистрирован глобально через `APP_INTERCEPTOR` в `AppModule`

### Improved

- Улучшена тестируемость за счет использования DI для конфигурации
- Добавлены подробные логи на всех этапах обработки транскрибации
- Добавлены unit тесты для `LoggingInterceptor` (100% покрытие)
