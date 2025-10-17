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

## 0.7.0

### Added

- **Provider Pattern**: реализован паттерн Factory Provider для STT провайдеров
  - Добавлен токен инжекции `STT_PROVIDER` в `common/constants/tokens.ts`
  - `TranscriptionModule` теперь использует `useFactory` для создания провайдеров
  - Упрощено добавление новых провайдеров в будущем
- **Global Exception Filter**: добавлен централизованный обработчик исключений `AllExceptionsFilter`
  - Унифицированный формат ошибок для всех эндпоинтов
  - Автоматическое логирование ошибок с различными уровнями (warn для 4xx, error для 5xx)
  - Поддержка Fastify-специфичных ответов
- **Professional Health Checks**: интегрирован `@nestjs/terminus` для мониторинга
  - Создан отдельный `HealthModule` с тремя эндпоинтами:
    - `GET /health` - полная проверка здоровья с пингом AssemblyAI API
    - `GET /health/ready` - проверка готовности к обработке запросов (readiness probe)
    - `GET /health/live` - проверка работоспособности сервиса (liveness probe)
  - Поддержка Kubernetes health probes

### Changed

- `TranscriptionService` использует инжекцию провайдера через токен `@Inject(STT_PROVIDER)` вместо прямой зависимости от `AssemblyAiProvider`
- Удалён старый самописный `HealthController` из корня `src/`
- `AppModule` теперь регистрирует `AllExceptionsFilter` глобально через `APP_FILTER`
- `AppModule` использует новый `HealthModule` вместо старого контроллера

### Improved

- Улучшена архитектура: провайдеры теперь легко расширяемы и тестируемы
- Стандартизирована обработка ошибок по всему приложению
- Health checks теперь соответствуют best practices NestJS и Kubernetes

## 0.8.0

### Added

- **Swagger/OpenAPI документация**: полная интеграция документации API
  - Установлен пакет `@nestjs/swagger@11.2.1`
  - Настроен `SwaggerModule` в `main.ts` с детальной конфигурацией
  - Добавлены декораторы `@ApiProperty` и `@ApiPropertyOptional` к `TranscribeFileDto`
  - Создан `TranscriptionResponseDto` с полным описанием структуры ответа транскрибации
  - Добавлены декораторы к `TranscriptionController`:
    - `@ApiTags`, `@ApiOperation` для описания эндпоинтов
    - `@ApiResponse`, `@ApiBadRequestResponse`, `@ApiUnauthorizedResponse`, `@ApiGatewayTimeoutResponse`, `@ApiServiceUnavailableResponse` для документирования всех возможных ответов
  - Добавлены декораторы к `HealthController` с примерами ответов
  - Документация доступна по адресу: `http://localhost:3001/api/docs`
  - Настроена кастомизация Swagger UI (скрытие topbar, сортировка тегов, фильтрация, время выполнения запросов)

### Improved

- API теперь полностью задокументирован с примерами запросов и ответов
- Все эндпоинты имеют детальные описания и информацию о возможных ошибках
- Улучшена читаемость кода за счёт явного указания типов возврата в контроллерах
- Добавлены метаданные проекта в Swagger (заголовок, описание, версия, контакты, лицензия)

## 0.8.2

### Added

- **Path Aliases**: добавлена поддержка path aliases для более чистых импортов
  - Настроены aliases: `@/*`, `@common/*`, `@modules/*`, `@config/*`, `@providers/*`, `@test/*`
  - Обновлены все импорты в исходном коде и тестах
  - Настроен `moduleNameMapper` в Jest для корректной работы тестов
  - Улучшена читаемость кода за счет замены относительных путей на алиасы

### Changed

- Добавлен корневой эндпоинт индекса API: `GET /{API_BASE_PATH}/{API_VERSION}` (по умолчанию `GET /api/v1`)
  - Возвращает компактный JSON с метаданными сервиса и полезными ссылками (`self`, `docs`, `health`, `transcriptions`)
  - Без редиректов, стабильный для машинных клиентов

### Removed

- Удален устаревший unit тест `test/unit/app.controller.spec.ts` (функциональность покрыта e2e тестами)

## 0.8.1

### Fixed

- **Graceful Shutdown**: добавлена корректная обработка сигналов SIGTERM и SIGINT
  - Реализован `app.enableShutdownHooks()` для активации lifecycle hooks
  - Добавлена обработка сигналов завершения с логированием и корректным закрытием соединений
  - Предотвращение потери данных при перезапуске (Kubernetes-ready)
- **Jest Configuration**: исправлен deprecated синтаксис в конфигурации тестов
  - Заменен `globals.ts-jest` на новый синтаксис `transform` в `package.json`
  - Обновлена конфигурация в `test/jest-e2e.json` для соответствия ts-jest v29+
  - Устранены предупреждения при запуске тестов

### Added

- **Config Validation**: добавлена валидация конфигурации при старте приложения
  - `AppConfig` класс с декораторами валидации (`@IsInt`, `@IsString`, `@IsIn`, `@Min`, `@Max`)
  - `SttConfig` класс с детальной валидацией всех параметров
  - Валидация порта (1-65535), nodeEnv (development/production/test), logLevel (debug/log/warn/error)
  - Валидация STT параметров: maxFileMb (1-1000), requestTimeoutSec (1-300), pollIntervalMs (100-10000)
  - Fail-fast подход: приложение не запустится с некорректной конфигурацией
  - Информативные сообщения об ошибках валидации при старте
- **Documentation**: создан `dev_docs/AUDIT_FIXES.md` с детальным описанием всех исправлений

### Improved

- Улучшена надежность приложения за счет валидации конфигурации
- Предотвращение runtime ошибок из-за некорректных значений конфигурации
- Корректная обработка завершения работы в production окружении
- Соответствие современным best practices NestJS + TypeScript + Jest
