# micro-file-cache

Микросервис для временного кэширования файлов с автоматической очисткой по истечении времени жизни (TTL).

## Описание

`micro-file-cache` позволяет загружать файлы, указывать время их хранения в минутах, и автоматически удаляет устаревшие файлы. Сервис использует дедупликацию для предотвращения дублирования одинаковых файлов.

## Основные возможности

- ✅ Загрузка файлов с указанием TTL (время жизни)
- ✅ Автоматическая дедупликация файлов
- ✅ REST API для управления файлами
- ✅ Автоматическая очистка устаревших файлов
- ✅ Health check endpoint
- ✅ Docker поддержка
- ✅ Конфигурируемые ограничения

## Быстрый старт

### Требования

- Node.js 22 LTS
- pnpm (рекомендуется) или npm
- Docker (для контейнеризации)

### Установка

1. Клонируйте репозиторий:

```bash
git clone <repository-url>
cd micro-file-cache
```

2. Установите зависимости:

```bash
pnpm install
```

3. Настройте переменные окружения:

```bash
# Скопируйте файл конфигурации для разработки
cp env.dev .env

# Или создайте .env на основе примера
cp env.example .env
```

Подробная информация о настройке переменных окружения доступна в файле [docs/ENV_SETUP.md](docs/ENV_SETUP.md).

📖 **Быстрый старт**: См. [docs/QUICK_START.md](docs/QUICK_START.md) для пошаговой инструкции.

📚 **Примеры использования**: См. [docs/USAGE_EXAMPLES.md](docs/USAGE_EXAMPLES.md) для практических примеров интеграции.

## 📚 Документация

### Для пользователей

- **[Документация для пользователей](docs/README.md)** - полное руководство пользователя
- **[Быстрый старт](docs/QUICK_START.md)** - начните работу за 5 минут
- **[API Спецификация](docs/api-specification.md)** - полное описание REST API
- **[Примеры использования](docs/USAGE_EXAMPLES.md)** - подробные примеры на разных языках
- **[Быстрые примеры](docs/QUICK_EXAMPLES.md)** - примеры основных операций
- **[Настройка переменных окружения](docs/ENV_SETUP.md)** - конфигурация сервиса
- **[Docker документация](docs/DOCKER_README.md)** - подробное руководство по Docker
- **[Архитектура](docs/architecture.md)** - техническая архитектура системы

### Для разработчиков

- **[Документация для разработчиков](dev_docs/README.md)** - руководство для разработчиков
- **[E2E тестирование](dev_docs/E2E_TESTING.md)** - подробное руководство по тестированию
- **[Модуль хранилища](dev_docs/STORAGE_MODULE.md)** - документация модуля хранилища
- **[DTO документация](dev_docs/DTO_DOCUMENTATION.md)** - документация DTO классов
- **[Changelog](dev_docs/CHANGELOG.md)** - история изменений

4. Запустите в режиме разработки:

```bash
pnpm run start:dev
```

Сервис будет доступен по адресу: `http://localhost:3000`

### Docker

```bash
# Сборка образа
docker build -t micro-file-cache .

# Запуск контейнера
docker run -p 3000:3000 \
  -e STORAGE_DIR=/app/storage \
  -e DATA_DIR=/app/data \
  -v file-storage:/app/storage \
  -v file-data:/app/data \
  micro-file-cache
```

### Docker Compose

```bash
docker-compose up -d
```

## Конфигурация

### Переменные окружения

| Переменная             | По умолчанию                            | Описание                                                                    |
| ---------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `NODE_ENV`             | `production`                            | Режим работы приложения                                                     |
| `LISTEN_HOST`          | `localhost`                             | Хост для HTTP сервера                                                       |
| `LISTEN_PORT`          | `3000`                                  | Порт для HTTP сервера                                                       |
| `AUTH_ENABLED`         | `true`                                  | Включить/выключить аутентификацию                                           |
| `AUTH_TOKEN`           | -                                       | Секретный ключ для аутентификации (обязательно)                             |
| `STORAGE_DIR`          | `../test-data/micro-file-cache/storage` | Путь к хранилищу файлов и метаданных                                        |
| `MAX_FILE_SIZE_MB`     | `100`                                   | Максимальный размер файла в мегабайтах                                      |
| `ALLOWED_MIME_TYPES`   | `[]` (все типы)                         | Разрешенные MIME типы файлов                                                |
| `ENABLE_DEDUPLICATION` | `true`                                  | Включить дедупликацию файлов                                                |
| `CLEANUP_CRON`         | `0 */10 * * * *`                        | Cron выражение для очистки (каждые 10 минут)                                |
| `MAX_FILES_COUNT`      | `10000`                                 | Максимальное количество файлов в кэше                                       |
| `MAX_STORAGE_SIZE_MB`  | `1000`                                  | Максимальный общий размер хранилища в МБ                                    |
| `API_BASE_PATH`        | `api`                                   | Базовый путь для API                                                        |
| `API_VERSION`          | `v1`                                    | Версия API                                                                  |
| `LOG_LEVEL`            | `info`                                  | Уровень логирования                                                         |
| `CORS_ORIGIN`          | `true`                                  | CORS настройки                                                              |
| `TZ`                   | `UTC`                                   | Часовой пояс для работы с датами                                            |

### Пример .env файла

```bash
NODE_ENV=production
LISTEN_HOST=0.0.0.0
LISTEN_PORT=3000
AUTH_ENABLED=true
AUTH_TOKEN=your-very-secure-production-key-minimum-32-characters-long
STORAGE_DIR=/app/storage
MAX_FILE_SIZE_MB=100
ALLOWED_MIME_TYPES=["image/jpeg","image/png","application/pdf","text/plain"]
ENABLE_DEDUPLICATION=true
MAX_TTL_MIN=1440
CLEANUP_CRON=0 */5 * * * *
MAX_FILES_COUNT=10000
MAX_STORAGE_SIZE_MB=1000
API_BASE_PATH=api
API_VERSION=v1
LOG_LEVEL=info
CORS_ORIGIN=true
TZ=UTC
```

## API Документация

### Настройка базового пути API

По умолчанию API доступен по пути `/api/v1/`. Для размещения нескольких микросервисов на одном хосте можно настроить базовый путь:

```env
API_BASE_PATH=file-cache
API_VERSION=v1
```

В этом случае API будет доступен по пути `/file-cache/v1/`:

- Health check: `http://localhost:3000/file-cache/v1/health`
- Upload: `http://localhost:3000/file-cache/v1/files`

### Аутентификация

API защищен Bearer токен аутентификацией. Для доступа к защищенным endpoints необходимо передавать токен в заголовке `Authorization`:

```bash
curl -H "Authorization: Bearer your-token" http://localhost:3000/api/v1/files
```

**Исключения:**

- `/api/v1/health` - доступен без аутентификации

**Настройка аутентификации:**

- `AUTH_ENABLED=true` - включить аутентификацию
- `AUTH_TOKEN=your-secret-key` - секретный ключ (в production режиме минимум 32 символа)

### Основные endpoints

#### Загрузка файла

```http
POST /api/v1/files
Content-Type: multipart/form-data

file: <file>
ttlMinutes: <number>
```

**Пример:**

```bash
curl -H "Authorization: Bearer your-secret-token" \
  -X POST http://localhost:3000/api/v1/files \
  -F "file=@document.pdf" \
  -F "ttlMinutes=60"
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "http://localhost:3000/api/v1/files/550e8400-e29b-41d4-a716-446655440000/download",
    "originalName": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-01-15T10:30:00.000Z",
    "expiresAt": "2024-01-15T11:30:00.000Z",
    "ttlMinutes": 60,
    "isDuplicate": false
  }
}
```

#### Получение информации о файле

```http
GET /api/v1/files/:id
```

#### Скачивание файла

```http
GET /api/v1/files/:id/download
```

#### Удаление файла

```http
DELETE /api/v1/files/:id
```

#### Проверка состояния сервиса

```http
GET /api/v1/health
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3600,
    "version": "1.0.0",
    "environment": "development",
    "storage": {
      "totalFiles": 15,
      "totalSize": 52428800,
      "availableSpace": 1073741824
    },
    "cleanup": {
      "lastRun": "2024-01-15T10:30:00.000Z",
      "nextRun": "2024-01-15T10:31:00.000Z",
      "filesDeleted": 3
    }
  }
}
```

### Ограничения

- **Максимальный размер файла**: 100MB (настраивается через `MAX_FILE_SIZE_MB`)
- **Максимальный TTL**: 7 дней (настраивается через `MAX_TTL_MIN`)
- **Обязательный TTL**: При загрузке файла обязательно указывать время жизни (не больше `MAX_TTL_MIN`)
- **Разрешенные типы файлов**: любые (настраивается через `ALLOWED_MIME_TYPES`)
- **Максимальное количество файлов**: 10000 (настраивается через `MAX_FILES_COUNT`)
- **Максимальный размер хранилища**: 1000MB (настраивается через `MAX_STORAGE_SIZE_MB`)

## Примеры использования

### JavaScript/TypeScript

```typescript
// Загрузка файла
async function uploadFile(file: File, ttlMinutes: number, token: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ttlMinutes', ttlMinutes.toString());

  const response = await fetch('/api/v1/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
}

// Скачивание файла
function downloadFile(id: string, filename: string) {
  const link = document.createElement('a');
  link.href = `/api/v1/files/${id}/download`;
  link.download = filename;
  link.click();
}
```

### Python

```python
import requests

# Загрузка файла
def upload_file(file_path: str, ttl_minutes: int, token: str):
    headers = {'Authorization': f'Bearer {token}'}
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'ttlMinutes': ttl_minutes}
        response = requests.post('http://localhost:3000/api/v1/files',
                               files=files, data=data, headers=headers)
    return response.json()

# Скачивание файла
def download_file(file_id: str, save_path: str, token: str):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'http://localhost:3000/api/v1/files/{file_id}/download', headers=headers)
    with open(save_path, 'wb') as f:
        f.write(response.content)
```

### cURL

```bash
# Загрузка файла
curl -H "Authorization: Bearer your-secret-token" \
  -X POST http://localhost:3000/api/v1/files \
  -F "file=@document.pdf" \
  -F "ttlMinutes=60"

# Получение информации
curl -H "Authorization: Bearer your-secret-token" \
  http://localhost:3000/api/v1/files/550e8400-e29b-41d4-a716-446655440000

# Скачивание файла
curl -H "Authorization: Bearer your-secret-token" \
  -O http://localhost:3000/api/v1/files/550e8400-e29b-41d4-a716-446655440000/download

# Удаление файла
curl -H "Authorization: Bearer your-secret-token" \
  -X DELETE http://localhost:3000/api/v1/files/550e8400-e29b-41d4-a716-446655440000
```

## Разработка

### Запуск в режиме разработки

```bash
# Установка зависимостей
pnpm install

# Запуск в режиме разработки
pnpm run start:dev

# Сборка проекта
pnpm run build

# Запуск тестов
pnpm run test

# E2E тестирование
pnpm run test:e2e

# Линтинг
pnpm run lint
```

### Docker

```bash
# Продакшн режим с Docker Compose
docker-compose up -d

# Режим разработки
docker-compose --profile dev up -d micro-file-cache-dev

# Проверка статуса
docker-compose ps

# Остановка
docker-compose down
```

Подробная документация по Docker: [DOCKER_USAGE.md](./DOCKER_USAGE.md)

## Мониторинг

### Health Check

Сервис предоставляет endpoint `/api/v1/health` для мониторинга состояния:

- Статус сервиса
- Время работы
- Информация о хранилище
- Статистика очистки

## Безопасность

### Меры безопасности

- ✅ Bearer токен аутентификация
- ✅ Ограничение размера файлов
- ✅ Безопасные имена файлов (UUID)
- ✅ Защита от path traversal атак
- ✅ Валидация всех входных данных

### Рекомендации

- Используйте HTTPS в продакшене
- Настройте файрвол для ограничения доступа
- Регулярно обновляйте зависимости
- Мониторьте логи на предмет подозрительной активности

## Troubleshooting

### Частые проблемы

#### Файл не загружается

- Проверьте размер файла (максимум настраивается через `MAX_FILE_SIZE_MB`)
- Проверьте доступность места на диске

#### Файлы не удаляются автоматически

- Проверьте работу cron job
- Убедитесь, что сервис запущен
- Проверьте логи на ошибки

#### Ошибки доступа к файлам

- Проверьте права доступа к директориям
- Убедитесь, что пути в .env корректны
- Проверьте доступность файловой системы

### Логи

```bash
# Просмотр логов в Docker
docker logs micro-file-cache

# Просмотр логов в режиме разработки
pnpm run start:dev
```

## Лицензия

MIT License

## Поддержка

Для вопросов и предложений создавайте issues в репозитории проекта.

## Changelog

См. [CHANGELOG.md](docs/CHANGELOG.md) для истории изменений.

---

## Для разработчиков

### Структура проекта

```
micro-file-cache/
├── src/
│   ├── main.ts                    # Точка входа
│   ├── app.module.ts              # Корневой модуль
│   ├── modules/
│   │   ├── files/                 # Модуль работы с файлами
│   │   ├── storage/               # Модуль хранилища
│   │   └── cleanup/               # Модуль очистки
│   ├── common/                    # Общие утилиты
│   └── config/                    # Конфигурация
├── test/                          # Тесты
├── docs/                          # Документация
├── Dockerfile
├── docker-compose.yml
└── package.json
```

### Дополнительные команды разработки

```bash
# Запуск тестов с покрытием
pnpm run test:cov

# Форматирование кода
pnpm run format

# Режим разработки с Docker
docker-compose --profile dev up -d micro-file-cache-dev
```

### Технологии

- **Node.js** - среда выполнения
- **TypeScript** - язык программирования
- **NestJS** - фреймворк для создания масштабируемых серверных приложений
- **Fastify** - HTTP адаптер (высокая производительность)
