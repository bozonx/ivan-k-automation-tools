# Webhook Updater Service

Веб-сервис для автоматизации обновления репозиториев и перезапуска Docker Compose контейнеров через HTTP webhook'и.

## Описание

Этот сервис предоставляет HTTP API для выполнения следующих операций:

- **Git Pull**: Обновление репозиториев из удаленного репозитория
- **Docker Compose Update**: Обновление и перезапуск Docker Compose контейнеров
- **Комбинированные операции**: Git pull + Docker Compose перезапуск

Сервис идеально подходит для автоматизации деплоя при использовании CI/CD систем, GitHub Actions, GitLab CI или других инструментов автоматизации.

## Функциональность

### Поддерживаемые операции

1. **Обновление репозитория** (`?repo=<repository_name>`)

   - Выполняет `git pull` в указанном репозитории
   - Репозиторий должен находиться в `/data/repos/<repository_name>`

2. **Обновление Docker Compose** (`?compose=<compose_name>`)

   - Выполняет `docker-compose pull` и `docker-compose restart`
   - Конфигурация должна находиться в `/data/compose/<compose_name>`

3. **Комбинированная операция** (`?repo=<repository_name>&compose=<compose_name>`)
   - Сначала выполняет git pull
   - Затем обновляет и перезапускает Docker Compose контейнеры

### Авторизация

- Опциональная авторизация через токен
- Токен задается через переменную окружения `AUTH_TOKEN`
- Если `AUTH_TOKEN` не задан, авторизация отключена
- Токен передается через параметр `?token=<auth_token>`

## Структура директорий

```
/data/
├── repos/           # Репозитории для обновления
│   ├── my-app/
│   └── another-repo/
└── compose/         # Docker Compose конфигурации
    ├── my-service/
    └── web-services/
```

## API Endpoints

### GET /

Основной endpoint для всех операций.

**Параметры:**

- `repo` (опционально) - имя репозитория для обновления
- `compose` (опционально) - имя Docker Compose конфигурации
- `token` (опционально) - токен авторизации

**Примеры запросов:**

```bash
# Обновить репозиторий
GET /?repo=my-app

# Обновить Docker Compose
GET /?compose=my-service

# Комбинированная операция
GET /?repo=my-app&compose=my-service

# С авторизацией
GET /?repo=my-app&token=your-secret-token
```

## Тестирование с curl

### 1. Обновление репозитория

```bash
# Без авторизации
curl "http://localhost:80/?repo=my-app"

# С авторизацией
curl "http://localhost:80/?repo=my-app&token=your-secret-token"
```

### 2. Обновление Docker Compose

```bash
# Без авторизации
curl "http://localhost:80/?compose=my-service"

# С авторизацией
curl "http://localhost:80/?compose=my-service&token=your-secret-token"
```

### 3. Комбинированная операция

```bash
# Без авторизации
curl "http://localhost:80/?repo=my-app&compose=my-service"

# С авторизацией
curl "http://localhost:80/?repo=my-app&compose=my-service&token=your-secret-token"
```

### 4. Тестирование ошибок

```bash
# Неверный токен
curl "http://localhost:80/?repo=my-app&token=wrong-token"

# Отсутствующие параметры
curl "http://localhost:80/"

# Несуществующий репозиторий
curl "http://localhost:80/?repo=non-existent-repo"
```

## Примеры ответов

### Успешное обновление репозитория

```json
{
  "success": true,
  "operation": "git_pull",
  "repo": "my-app",
  "output": "Already up to date.\n"
}
```

### Успешная комбинированная операция

```json
{
  "success": true,
  "operation": "git_pull",
  "repo": "my-app",
  "output": "Already up to date.\n",
  "composeUpdate": {
    "success": true,
    "compose": "my-service",
    "pullOutput": "Pulling web ... up-to-date\n",
    "restartOutput": "Restarting my-service_web_1 ... done\n"
  }
}
```

### Ошибка авторизации

```json
{
  "error": "Unauthorized",
  "message": "Неверный токен авторизации"
}
```

### Ошибка операции

```json
{
  "success": false,
  "operation": "git_pull",
  "repo": "non-existent-repo",
  "error": "Command failed: test -d \"/data/repos/non-existent-repo\""
}
```

## Docker Compose пример

Создайте файл `docker-compose.yml` в директории с webhook-updater:

```yaml
version: "3.8"

services:
  webhook-updater:
    image: bozonx/webhook-updater
    container_name: webhook-updater
    ports:
      - "8080:80" # Проброс порта 80 контейнера на порт 8080 хоста
    volumes:
      # Монтируем директории с репозиториями и compose файлами
      - /path/to/your/repos:/data/repos:ro
      - /path/to/your/compose:/data/compose:ro
      # Монтируем Docker socket для управления контейнерами
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      # Опционально: токен авторизации
      - AUTH_TOKEN=your-secret-token-here
      # Опционально: порт (по умолчанию 80)
      - PORT=80
    restart: unless-stopped
    # Запуск от root для доступа к Docker socket
    user: "0:0"
    networks:
      - webhook-network

networks:
  webhook-network:
    driver: bridge
```

### Запуск

```bash
# Сборка и запуск
docker-compose up --build -d

# Просмотр логов
docker-compose logs -f webhook-updater

# Остановка
docker-compose down
```

## Переменные окружения

| Переменная   | Описание                       | По умолчанию | Обязательная |
| ------------ | ------------------------------ | ------------ | ------------ |
| `AUTH_TOKEN` | Токен для авторизации запросов | -            | Нет          |
| `PORT`       | Порт для HTTP сервера          | 80           | Нет          |
| `NODE_ENV`   | Окружение Node.js              | production   | Нет          |

## Требования

### Системные требования

- Docker и Docker Compose
- Git (устанавливается в контейнере)
- Доступ к Docker socket для управления контейнерами

### Структура файлов

- Репозитории должны быть клонированы в `/data/repos/`
- Docker Compose файлы должны находиться в `/data/compose/`
- Каждая директория должна содержать `docker-compose.yml` или `docker-compose.yaml`

## Безопасность

⚠️ **Важные замечания по безопасности:**

1. **Docker Socket**: Контейнер монтирует Docker socket, что дает полный доступ к Docker daemon
2. **Авторизация**: Рекомендуется всегда использовать `AUTH_TOKEN` в продакшене
3. **Сеть**: Ограничьте доступ к сервису только доверенным IP адресам
4. **Права доступа**: Репозитории монтируются в режиме только для чтения

## Логирование

Сервис ведет подробное логирование всех операций:

- Входящие HTTP запросы
- Результаты git pull операций
- Результаты docker-compose операций
- Ошибки и исключения

Логи выводятся в stdout и могут быть собраны через Docker logging driver.

## Мониторинг

Для мониторинга состояния сервиса можно использовать:

```bash
# Проверка здоровья контейнера
docker-compose ps

# Просмотр логов в реальном времени
docker-compose logs -f webhook-updater

# Проверка доступности API
curl -f "http://localhost:8080/?repo=test" || echo "Service unavailable"
```

## Примеры использования

### GitHub Actions

```yaml
- name: Deploy to server
  run: |
    curl -X GET "https://your-server.com:8080/?repo=my-app&compose=my-service&token=${{ secrets.WEBHOOK_TOKEN }}"
```

### GitLab CI

```yaml
deploy:
  script:
    - curl -X GET "https://your-server.com:8080/?repo=my-app&compose=my-service&token=$WEBHOOK_TOKEN"
```

### Cron задача

```bash
# Обновление каждые 5 минут
*/5 * * * * curl -s "http://localhost:8080/?repo=my-app&token=your-token" > /dev/null
```
