# Docker Usage для micro-file-cache

## Быстрый старт

### Продакшн режим

```bash
# Запуск с docker-compose
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### Режим разработки

```bash
# Запуск с профилем разработки
docker-compose --profile dev up -d micro-file-cache-dev

# Остановка
docker-compose --profile dev down
```

## Проверка работоспособности

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Тест загрузки файла (с аутентификацией)
curl -X POST \
  -H "Authorization: Bearer production-secret-key-change-this-12345678901234567890" \
  -F "file=@test-file.txt" \
  -F "ttl=3600" \
  http://localhost:3000/api/v1/files
```

## Управление

```bash
# Пересборка без кэша
docker-compose build --no-cache

# Очистка volumes
docker-compose down -v

# Просмотр логов конкретного сервиса
docker-compose logs -f micro-file-cache
```

## Переменные окружения

Основные настройки в файле `env.docker`:

- `AUTH_ENABLED=true` - включена аутентификация
- `AUTH_SECRET_KEY` - секретный ключ для токенов
- `STORAGE_PATH=/app/storage` - путь к хранилищу
- `MAX_FILE_SIZE_MB=100` - максимальный размер файла в мегабайтах (100MB)
- `MAX_TTL_MIN=60` - максимальный TTL в минутах (по умолчанию 60)

## Volumes

- `file_cache_storage` - постоянное хранилище файлов
- `file_cache_logs` - логи приложения

## Порты

- `3000:80` - основной сервис
- `3001:3000` - режим разработки
