# Docker Setup для micro-file-cache

## Обзор

Этот документ содержит инструкции по запуску micro-file-cache в Docker контейнере.

## Файлы Docker конфигурации

- `Dockerfile` - продакшн образ с многоэтапной сборкой
- `Dockerfile.dev` - образ для разработки с hot reload
- `docker-compose.yml` - оркестрация контейнеров
- `.dockerignore` - файлы, исключаемые из Docker контекста
- `env.docker` - переменные окружения для Docker

## Быстрый старт

### Продакшн режим

```bash
# Сборка и запуск продакшн контейнера
docker-compose up --build

# Запуск в фоновом режиме
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f micro-file-cache
```

### Режим разработки

```bash
# Запуск с профилем разработки
docker-compose --profile dev up --build micro-file-cache-dev

# Или запуск всех сервисов включая dev
docker-compose --profile dev up --build
```

## Проверка работоспособности

### Health Check

```bash
# Проверка health endpoint
curl http://localhost:3000/api/v1/health

# Проверка через Docker
docker-compose exec micro-file-cache curl http://localhost:80/api/v1/health
```

### Тестирование API

```bash
# Загрузка файла
curl -X POST \
  -H "Authorization: Bearer your-token" \
  -F "file=@test-file.txt" \
  -F "ttl=60" \
  http://localhost:3000/api/v1/files

# Получение информации о файле
curl -H "Authorization: Bearer your-token" \
  http://localhost:3000/api/v1/files/{file-id}

# Скачивание файла
curl -H "Authorization: Bearer your-token" \
  http://localhost:3000/api/v1/files/{file-id}/download
```

## Управление контейнерами

### Основные команды

```bash
# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes
docker-compose down -v

# Пересборка без кэша
docker-compose build --no-cache

# Просмотр логов конкретного сервиса
docker-compose logs -f micro-file-cache

# Выполнение команд в контейнере
docker-compose exec micro-file-cache sh
```

### Очистка

```bash
# Удаление неиспользуемых образов
docker image prune

# Удаление всех неиспользуемых ресурсов
docker system prune -a

# Удаление volumes
docker volume prune
```

## Переменные окружения

Основные переменные настраиваются в файле `env.docker`:

- `NODE_ENV` - режим работы (по умолчанию: development)
- `LISTEN_HOST` - хост для прослушивания (по умолчанию: localhost, для Docker: 0.0.0.0)
- `LISTEN_PORT` - порт (по умолчанию: 3000, для продакшн: 80)
- `AUTH_ENABLED` - включение аутентификации (по умолчанию: true)
- `AUTH_SECRET_KEY` - секретный ключ для токенов (обязателен если AUTH_ENABLED=true)
- `STORAGE_PATH` - путь к хранилищу файлов (обязателен)
- `MAX_FILE_SIZE_MB` - максимальный размер файла в мегабайтах
- `MAX_TTL_MIN` - максимальный TTL в минутах (по умолчанию 60)
- `CLEANUP_INTERVAL_MIN` - интервал очистки в минутах

## Volumes

- `file_cache_storage` - постоянное хранилище файлов
- `file_cache_logs` - логи приложения
- `file_cache_storage_dev` - хранилище для разработки

## Сетевые настройки

- Сеть: `micro-file-cache-network`
- Порт продакшн: `3000:80`
- Порт разработки: `3001:3000`

## Безопасность

- Приложение запускается под непривилегированным пользователем `nestjs`
- Используется Alpine Linux для минимальной поверхности атаки
- Health check проверяет доступность API
- Переменные окружения изолированы в отдельном файле

## Мониторинг

### Логи

```bash
# Просмотр логов в реальном времени
docker-compose logs -f

# Логи с временными метками
docker-compose logs -t

# Логи за последние 100 строк
docker-compose logs --tail=100
```

### Метрики

```bash
# Использование ресурсов
docker stats micro-file-cache

# Информация о контейнере
docker inspect micro-file-cache
```

## Troubleshooting

### Проблемы с портами

```bash
# Проверка занятых портов
netstat -tulpn | grep :3000

# Изменение порта в docker-compose.yml
ports:
  - "3001:80"  # Внешний порт 3001
```

### Проблемы с правами доступа

```bash
# Проверка прав на volumes
docker-compose exec micro-file-cache ls -la /app/storage

# Исправление прав
docker-compose exec micro-file-cache chown -R nestjs:nodejs /app/storage
```

### Проблемы с памятью

```bash
# Ограничение памяти в docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

## Продакшн рекомендации

1. **Измените секретный ключ** в `env.docker`
2. **Настройте логирование** на внешнюю систему
3. **Используйте внешний volume** для данных
4. **Настройте мониторинг** и алерты
5. **Регулярно обновляйте** базовый образ
6. **Используйте HTTPS** в продакшене
7. **Настройте backup** для данных
