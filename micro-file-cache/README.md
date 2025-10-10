# micro-file-cache

Микросервис для временного кэширования файлов с автоматической очисткой по истечении времени жизни (TTL).

## Описание

`micro-file-cache` позволяет загружать файлы, указывать время их хранения в минутах, и автоматически удаляет устаревшие файлы. Сервис использует дедупликацию на основе SHA-256 хеширования для предотвращения дублирования одинаковых файлов.

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

- Node.js 18+
- pnpm (рекомендуется) или npm
- Docker (опционально)

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
cp .env.example .env
# Отредактируйте .env файл при необходимости
```

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

| Переменная         | По умолчанию                            | Описание                                      |
| ------------------ | --------------------------------------- | --------------------------------------------- |
| `NODE_ENV`         | `development`                           | Режим работы приложения                       |
| `PORT`             | `3000`                                  | Порт для HTTP сервера                         |
| `AUTH_TOKEN`       | -                                       | Bearer токен для аутентификации (опционально) |
| `STORAGE_DIR`      | `../test-data/micro-file-cache/storage` | Директория для хранения файлов                |
| `DATA_DIR`         | `../test-data/micro-file-cache/data`    | Директория для метаданных                     |
| `FILE_MAX_SIZE_MB` | `10`                                    | Максимальный размер файла в мегабайтах        |
| `TTL_MAX_MINUTES`  | `10080`                                 | Максимальный TTL в минутах (7 дней)           |
| `CLEANUP_INTERVAL` | `60000`                                 | Интервал очистки в миллисекундах (1 минута)   |

### Пример .env файла

```bash
NODE_ENV=production
PORT=3000
AUTH_TOKEN=your-secret-token
STORAGE_DIR=/app/storage
DATA_DIR=/app/data
FILE_MAX_SIZE_MB=10
TTL_MAX_MINUTES=10080
CLEANUP_INTERVAL=60000
```

## API Документация

### Основные endpoints

#### Загрузка файла

```http
POST /api/files
Content-Type: multipart/form-data

file: <file>
ttlMinutes: <number>
```

**Пример:**

```bash
curl -H "Authorization: Bearer your-secret-token" \
  -X POST http://localhost:3000/api/files \
  -F "file=@document.pdf" \
  -F "ttlMinutes=60"
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "http://localhost:3000/files/550e8400-e29b-41d4-a716-446655440000",
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
GET /api/files/:id
```

#### Скачивание файла

```http
GET /files/:id
```

#### Удаление файла

```http
DELETE /api/files/:id
```

#### Проверка состояния сервиса

```http
GET /api/health
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

- **Максимальный размер файла**: 10MB (настраивается через `FILE_MAX_SIZE_MB`)
- **Максимальный TTL**: 7 дней (10080 минут, настраивается через `TTL_MAX_MINUTES`)
- **Минимальный TTL**: 1 минута
- **Разрешенные типы файлов**: любые

## Примеры использования

### JavaScript/TypeScript

```typescript
// Загрузка файла
async function uploadFile(file: File, ttlMinutes: number, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("ttlMinutes", ttlMinutes.toString());

  const response = await fetch("/api/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
}

// Скачивание файла
function downloadFile(id: string, filename: string) {
  const link = document.createElement("a");
  link.href = `/files/${id}`;
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
        response = requests.post('http://localhost:3000/api/files',
                               files=files, data=data, headers=headers)
    return response.json()

# Скачивание файла
def download_file(file_id: str, save_path: str, token: str):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'http://localhost:3000/files/{file_id}', headers=headers)
    with open(save_path, 'wb') as f:
        f.write(response.content)
```

### cURL

```bash
# Загрузка файла
curl -H "Authorization: Bearer your-secret-token" \
  -X POST http://localhost:3000/api/files \
  -F "file=@document.pdf" \
  -F "ttlMinutes=60"

# Получение информации
curl -H "Authorization: Bearer your-secret-token" \
  http://localhost:3000/api/files/550e8400-e29b-41d4-a716-446655440000

# Скачивание файла
curl -H "Authorization: Bearer your-secret-token" \
  -O http://localhost:3000/files/550e8400-e29b-41d4-a716-446655440000

# Удаление файла
curl -H "Authorization: Bearer your-secret-token" \
  -X DELETE http://localhost:3000/api/files/550e8400-e29b-41d4-a716-446655440000
```

## Разработка

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

### Команды разработки

```bash
# Установка зависимостей
pnpm install

# Запуск в режиме разработки
pnpm run start:dev

# Сборка проекта
pnpm run build

# Запуск тестов
pnpm run test

# Запуск тестов с покрытием
pnpm run test:cov

# Линтинг
pnpm run lint

# Форматирование кода
pnpm run format
```

### Тестирование

```bash
# Unit тесты
pnpm run test

# E2E тесты
pnpm run test:e2e

# Тесты с покрытием
pnpm run test:cov
```

## Мониторинг

### Health Check

Сервис предоставляет endpoint `/api/health` для мониторинга состояния:

- Статус сервиса
- Время работы
- Информация о хранилище
- Статистика очистки

### Логирование

Сервис логирует:

- Загрузку и удаление файлов
- Ошибки операций
- Запуск очистки кэша
- Изменения конфигурации

### Метрики

- Количество файлов в кэше
- Общий размер хранилища
- Время выполнения операций
- Количество ошибок

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

## Производительность

### Оптимизации

- Стриминг для больших файлов
- Кэширование метаданных в памяти
- Батчевые операции с файловой системой
- Асинхронная обработка

### Рекомендуемые настройки

- **CPU**: 2+ ядра
- **RAM**: 512MB+ (зависит от количества файлов)
- **Диск**: SSD рекомендуется для лучшей производительности
- **Сеть**: 100Mbps+ для загрузки файлов

## Troubleshooting

### Частые проблемы

#### Файл не загружается

- Проверьте размер файла (максимум настраивается через `FILE_MAX_SIZE_MB`)
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

См. [CHANGELOG.md](docs/changelog.md) для истории изменений.
