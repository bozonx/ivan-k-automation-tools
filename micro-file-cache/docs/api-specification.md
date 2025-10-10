# API Спецификация micro-file-cache

## Обзор

Данный документ описывает REST API микросервиса `micro-file-cache` для временного кэширования файлов с автоматической очисткой.

## Базовый URL

```
http://localhost:3000
```

## Аутентификация

В текущей версии аутентификация не требуется. В будущих версиях может быть добавлена поддержка API ключей или JWT токенов.

## Форматы данных

### Content-Type

- **Загрузка файлов**: `multipart/form-data`
- **Остальные запросы**: `application/json`

### Формат ответов

Все ответы возвращаются в формате JSON с единообразной структурой:

```json
{
  "success": true,
  "data": { ... },
  "message": "Описание результата",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Формат ошибок

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Описание ошибки",
    "details": { ... }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Endpoints

### 1. Загрузка файла

**POST** `/api/files`

Загружает файл в кэш с указанием времени жизни.

#### Параметры запроса

| Параметр     | Тип    | Обязательный | Описание                              |
| ------------ | ------ | ------------ | ------------------------------------- |
| `file`       | File   | Да           | Загружаемый файл                      |
| `ttlMinutes` | number | Да           | Время жизни файла в минутах (1-10080) |

#### Ограничения

- Максимальный размер файла: 10MB
- Разрешенные MIME типы: `image/*`, `application/pdf`, `text/*`
- Минимальный TTL: 1 минута
- Максимальный TTL: 7 дней (10080 минут)

#### Пример запроса

```bash
curl -X POST http://localhost:3000/api/files \
  -F "file=@document.pdf" \
  -F "ttlMinutes=60"
```

#### Пример ответа

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
  },
  "message": "File uploaded successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Коды ошибок

| Код                 | Описание                     |
| ------------------- | ---------------------------- |
| `FILE_TOO_LARGE`    | Размер файла превышает лимит |
| `INVALID_MIME_TYPE` | Неподдерживаемый тип файла   |
| `INVALID_TTL`       | Некорректное значение TTL    |
| `UPLOAD_FAILED`     | Ошибка при сохранении файла  |

### 2. Получение информации о файле

**GET** `/api/files/:id`

Возвращает метаданные файла по его ID.

#### Параметры пути

| Параметр | Тип    | Описание   |
| -------- | ------ | ---------- |
| `id`     | string | UUID файла |

#### Пример запроса

```bash
curl http://localhost:3000/api/files/550e8400-e29b-41d4-a716-446655440000
```

#### Пример ответа

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-01-15T10:30:00.000Z",
    "expiresAt": "2024-01-15T11:30:00.000Z",
    "ttlMinutes": 60,
    "isExpired": false,
    "remainingMinutes": 45
  },
  "message": "File information retrieved",
  "timestamp": "2024-01-15T10:45:00.000Z"
}
```

#### Коды ошибок

| Код              | Описание       |
| ---------------- | -------------- |
| `FILE_NOT_FOUND` | Файл не найден |
| `FILE_EXPIRED`   | Файл истек     |

### 3. Скачивание файла

**GET** `/files/:id`

Возвращает файл для скачивания.

#### Параметры пути

| Параметр | Тип    | Описание   |
| -------- | ------ | ---------- |
| `id`     | string | UUID файла |

#### Пример запроса

```bash
curl -O http://localhost:3000/files/550e8400-e29b-41d4-a716-446655440000
```

#### Ответ

- **Content-Type**: Соответствует MIME типу файла
- **Content-Disposition**: `attachment; filename="original-name"`
- **Content-Length**: Размер файла в байтах

#### Коды ошибок

| Код              | Описание       |
| ---------------- | -------------- |
| `FILE_NOT_FOUND` | Файл не найден |
| `FILE_EXPIRED`   | Файл истек     |

### 4. Удаление файла

**DELETE** `/api/files/:id`

Удаляет файл из кэша.

#### Параметры пути

| Параметр | Тип    | Описание   |
| -------- | ------ | ---------- |
| `id`     | string | UUID файла |

#### Пример запроса

```bash
curl -X DELETE http://localhost:3000/api/files/550e8400-e29b-41d4-a716-446655440000
```

#### Пример ответа

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deletedAt": "2024-01-15T10:45:00.000Z"
  },
  "message": "File deleted successfully",
  "timestamp": "2024-01-15T10:45:00.000Z"
}
```

#### Коды ошибок

| Код              | Описание                  |
| ---------------- | ------------------------- |
| `FILE_NOT_FOUND` | Файл не найден            |
| `DELETE_FAILED`  | Ошибка при удалении файла |

### 5. Проверка состояния сервиса

**GET** `/api/health`

Возвращает информацию о состоянии сервиса.

#### Пример запроса

```bash
curl http://localhost:3000/api/health
```

#### Пример ответа

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
  },
  "message": "Service is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Модели данных

### FileInfo

```typescript
interface FileInfo {
  id: string; // UUID файла
  originalName: string; // Оригинальное имя файла
  size: number; // Размер файла в байтах
  mimeType: string; // MIME тип файла
  uploadedAt: string; // ISO-8601 дата загрузки
  expiresAt: string; // ISO-8601 дата истечения
  ttlMinutes: number; // TTL в минутах
  isExpired?: boolean; // Флаг истечения (только для GET)
  remainingMinutes?: number; // Оставшееся время в минутах (только для GET)
}
```

### UploadResponse

```typescript
interface UploadResponse {
  id: string;
  url: string; // URL для скачивания
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  expiresAt: string;
  ttlMinutes: number;
  isDuplicate: boolean; // Флаг дубликата
}
```

### HealthResponse

```typescript
interface HealthResponse {
  status: "healthy" | "unhealthy";
  uptime: number; // Время работы в секундах
  version: string;
  environment: string;
  storage: {
    totalFiles: number;
    totalSize: number; // Общий размер в байтах
    availableSpace: number; // Доступное место в байтах
  };
  cleanup: {
    lastRun: string; // ISO-8601 дата последнего запуска
    nextRun: string; // ISO-8601 дата следующего запуска
    filesDeleted: number; // Количество удаленных файлов
  };
}
```

## Коды HTTP статусов

| Код | Описание                   |
| --- | -------------------------- |
| 200 | Успешный запрос            |
| 201 | Файл успешно загружен      |
| 400 | Некорректный запрос        |
| 404 | Файл не найден             |
| 413 | Файл слишком большой       |
| 415 | Неподдерживаемый тип файла |
| 500 | Внутренняя ошибка сервера  |

## Примеры использования

### JavaScript/TypeScript

```typescript
// Загрузка файла
async function uploadFile(file: File, ttlMinutes: number) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("ttlMinutes", ttlMinutes.toString());

  const response = await fetch("/api/files", {
    method: "POST",
    body: formData,
  });

  return response.json();
}

// Получение информации о файле
async function getFileInfo(id: string) {
  const response = await fetch(`/api/files/${id}`);
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
def upload_file(file_path: str, ttl_minutes: int):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'ttlMinutes': ttl_minutes}
        response = requests.post('http://localhost:3000/api/files',
                               files=files, data=data)
    return response.json()

# Получение информации о файле
def get_file_info(file_id: str):
    response = requests.get(f'http://localhost:3000/api/files/{file_id}')
    return response.json()

# Скачивание файла
def download_file(file_id: str, save_path: str):
    response = requests.get(f'http://localhost:3000/files/{file_id}')
    with open(save_path, 'wb') as f:
        f.write(response.content)
```

### cURL

```bash
# Загрузка файла
curl -X POST http://localhost:3000/api/files \
  -F "file=@document.pdf" \
  -F "ttlMinutes=60"

# Получение информации
curl http://localhost:3000/api/files/550e8400-e29b-41d4-a716-446655440000

# Скачивание файла
curl -O http://localhost:3000/files/550e8400-e29b-41d4-a716-446655440000

# Удаление файла
curl -X DELETE http://localhost:3000/api/files/550e8400-e29b-41d4-a716-446655440000

# Проверка состояния
curl http://localhost:3000/api/health
```

## Ограничения и рекомендации

### Ограничения

- Максимальный размер файла: 10MB
- Максимальное количество файлов: 10000
- Максимальный TTL: 7 дней
- Минимальный TTL: 1 минута

### Рекомендации

- Используйте разумные значения TTL для экономии места
- Регулярно проверяйте состояние сервиса через `/api/health`
- Обрабатывайте ошибки и повторяйте запросы при необходимости
- Используйте HTTPS в продакшене

## Версионирование API

Текущая версия API: `v1`

В будущих версиях могут быть добавлены:

- Поддержка папок и структуры каталогов
- Метрики использования
- Webhook уведомления об истечении файлов
- Поддержка сжатия файлов
- Аутентификация и авторизация
