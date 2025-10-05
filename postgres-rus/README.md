# PostgreSQL с русской локализацией

Этот сервис предоставляет PostgreSQL базу данных с настроенной русской локализацией.

## Использование

### Запуск с помощью Docker Compose

1. Убедитесь, что Docker и Docker Compose установлены на вашей системе
2. Перейдите в директорию с файлом `compose.yaml`
3. Запустите сервис:

```bash
docker-compose up -d
```

### Остановка сервиса

```bash
docker-compose down
```

### Перезапуск сервиса

```bash
docker-compose restart
```

### Просмотр логов

```bash
docker-compose logs -f db
```

## Конфигурация

### Переменные окружения

- `POSTGRES_PASSWORD`: Пароль для пользователя postgres (по умолчанию: "123")
- `POSTGRES_INITDB_ARGS`: Аргументы инициализации базы данных (включает русскую локализацию)

### Тома

- Данные PostgreSQL сохраняются в `../test-data/postgres:/var/lib/postgresql`

### Порты

По умолчанию порты не проброшены наружу. Если нужно подключиться к базе извне, раскомментируйте строки с портами в `compose.yaml`:

```yaml
ports:
  - "5432:5432"
```

## Подключение к базе данных

### Из контейнера

```bash
docker exec -it pg-main psql -U postgres
```

### Извне (если порты проброшены)

```bash
psql -h localhost -p 5432 -U postgres
```

## Пример использования в составе других сервисов

Вот пример `docker-compose.yml` файла, который показывает как использовать PostgreSQL сервис вместе с другими приложениями:

```yaml
version: "3.8"

services:
  # PostgreSQL база данных с русской локализацией
  db:
    image: bozonx/postgres-rus
    container_name: pg-main
    restart: always
    shm_size: 128mb
    volumes:
      - postgres_data:/var/lib/postgresql
    environment:
      POSTGRES_PASSWORD: "your_secure_password"
      POSTGRES_INITDB_ARGS: "--data-checksums --locale=ru_RU.UTF-8"
    ports:
      - "5432:5432"
    networks:
      - app-network

volumes:
  postgres_data:
```

### Ключевые моменты:

- **Переменные окружения**: Настройте `POSTGRES_DB`, `POSTGRES_USER` для создания конкретной базы и пользователя
- **Сеть**: Все сервисы подключены к одной сети для взаимодействия
- **Зависимости**: Используйте `depends_on` для правильного порядка запуска
- **Тома**: Данные PostgreSQL сохраняются в именованном томе `postgres_data`
- **Подключение**: Другие сервисы подключаются к базе по имени сервиса `db:5432`

## Особенности

- Использует образ `bozonx/postgres-rus` с русской локализацией
- Настроена поддержка русских символов (UTF-8)
- Включены проверки целостности данных
- Контейнер автоматически перезапускается при сбоях
- Размер общей памяти установлен в 128MB для оптимизации работы PostgreSQL
