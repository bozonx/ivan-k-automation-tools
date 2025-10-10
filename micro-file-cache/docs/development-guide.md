# Руководство по разработке micro-file-cache

## Обзор микросервиса

`micro-file-cache` - это микросервис для временного кэширования файлов с автоматической очисткой по истечении времени жизни (TTL). Сервис позволяет загружать файлы, указывать время их хранения в минутах, и автоматически удаляет устаревшие файлы.

## Технический стек

- **Node.js** - среда выполнения
- **TypeScript** - язык программирования
- **NestJS** - фреймворк для создания масштабируемых серверных приложений
- **Fastify** - HTTP адаптер (вместо Express по умолчанию)
- **Jest** - фреймворк для тестирования
- **Multer** - middleware для загрузки файлов
- **@nestjs/schedule** - для периодических задач (cron jobs)
- **crypto** - встроенный модуль Node.js для хеширования

## Архитектура микросервиса

### Основные компоненты

1. **FilesModule** - основной модуль для работы с файлами
2. **StorageModule** - модуль для работы с файловой системой
3. **CleanupModule** - модуль для автоматической очистки устаревших файлов

### Структура проекта

```
micro-file-cache/
├── src/
│   ├── main.ts                    # Точка входа приложения
│   ├── app.module.ts              # Корневой модуль
│   ├── modules/
│   │   ├── files/                 # Модуль работы с файлами
│   │   │   ├── files.module.ts
│   │   │   ├── files.controller.ts
│   │   │   ├── files.service.ts
│   │   │   └── dto/
│   │   │       ├── upload-file.dto.ts
│   │   │       └── file-response.dto.ts
│   │   ├── storage/               # Модуль файлового хранилища
│   │   │   ├── storage.module.ts
│   │   │   └── storage.service.ts
│   │   └── cleanup/               # Модуль очистки
│   │       ├── cleanup.module.ts
│   │       └── cleanup.service.ts
│   ├── common/
│   │   ├── interfaces/
│   │   │   ├── file.interface.ts
│   │   │   └── storage.interface.ts
│   │   └── utils/
│   │       ├── hash.util.ts
│   │       └── file.util.ts
│   └── config/
│       └── app.config.ts
├── test/                          # Тесты
├── docs/                          # Документация
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```

## API Endpoints

### REST API

- `POST /api/files` - загрузка файла с указанием TTL
- `GET /api/files/:id` - получение информации о файле
- `GET /files/:id` - скачивание файла (статический маршрут)
- `DELETE /api/files/:id` - удаление файла
- `GET /api/health` - проверка состояния сервиса

## Модели данных

### Интерфейс File

```typescript
interface FileInfo {
  id: string; // UUID файла
  originalName: string; // Оригинальное имя файла
  hash: string; // SHA-256 хеш файла
  size: number; // Размер файла в байтах
  mimeType: string; // MIME тип файла
  uploadedAt: string; // ISO-8601 дата загрузки
  expiresAt: string; // ISO-8601 дата истечения
  ttlMinutes: number; // TTL в минутах
  path: string; // Относительный путь в хранилище
}
```

### Формат data.json

```json
{
  "files": {
    "file-uuid-1": {
      "id": "file-uuid-1",
      "originalName": "example.pdf",
      "hash": "sha256-hash-string",
      "size": 1024,
      "mimeType": "application/pdf",
      "uploadedAt": "2024-01-15T10:30:00.000Z",
      "expiresAt": "2024-01-15T11:30:00.000Z",
      "ttlMinutes": 60,
      "path": "2024/01/15/file-uuid-1.pdf"
    }
  }
}
```

## Логика работы с файлами

### Загрузка файла

1. Получение файла через Multer
2. Вычисление SHA-256 хеша файла
3. Проверка существования файла с таким хешем
4. Если файл существует:
   - Обновление TTL существующего файла
   - Возврат информации о существующем файле
5. Если файл новый:
   - Генерация уникального UUID
   - Сохранение файла в хранилище
   - Запись метаданных в data.json
   - Возврат информации о новом файле

### Дедупликация

Система использует SHA-256 хеширование для предотвращения дублирования файлов:

```typescript
import { createHash } from "crypto";

function calculateFileHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
```

### Автоматическая очистка

Каждую минуту выполняется проверка файлов на истечение TTL:

1. Чтение data.json
2. Поиск файлов с `expiresAt < currentTime`
3. Удаление файлов из файловой системы
4. Удаление записей из data.json
5. Логирование удаленных файлов

## Переменные окружения

```bash
# Основные настройки
NODE_ENV=development
PORT=3000

# Пути к хранилищу
STORAGE_DIR=/app/storage                    # Продакшн
# STORAGE_DIR=../test-data/micro-file-cache/storage  # Разработка

DATA_DIR=/app/data                          # Продакшн
# DATA_DIR=../test-data/micro-file-cache/data        # Разработка

# Настройки загрузки файлов
MAX_FILE_SIZE=10485760                      # 10MB
ALLOWED_MIME_TYPES=image/*,application/pdf,text/*

# Настройки очистки
CLEANUP_INTERVAL=60000                      # 1 минута в мс
```

## Разработка с помощью AI в Cursor

### Рекомендуемый подход

1. **Начните с создания базовой структуры проекта**

   - Создайте package.json с необходимыми зависимостями
   - Настройте TypeScript конфигурацию
   - Создайте базовую структуру папок

2. **Реализуйте модули поэтапно**

   - Сначала StorageModule (базовая работа с файлами)
   - Затем FilesModule (API endpoints)
   - В конце CleanupModule (автоматическая очистка)

3. **Используйте AI для генерации кода**
   - Запрашивайте создание конкретных файлов
   - Просите объяснения сложных частей
   - Используйте AI для написания тестов

### Примеры запросов к AI

```
"Создай FilesController с методами для загрузки, получения и удаления файлов"
"Напиши StorageService для работы с файловой системой и data.json"
"Создай CleanupService с cron job для удаления устаревших файлов"
"Напиши unit тесты для FilesService"
```

## Тестирование

### Структура тестов

```
test/
├── unit/                    # Unit тесты
│   ├── files.service.spec.ts
│   ├── storage.service.spec.ts
│   └── cleanup.service.spec.ts
├── integration/             # Интеграционные тесты
│   ├── files.controller.spec.ts
│   └── app.e2e-spec.ts
└── fixtures/                # Тестовые данные
    └── test-files/
```

### Примеры тестов

```typescript
// files.service.spec.ts
describe("FilesService", () => {
  let service: FilesService;
  let storageService: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: StorageService,
          useValue: {
            saveFile: jest.fn(),
            getFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    storageService = module.get<StorageService>(StorageService);
  });

  it("should upload file successfully", async () => {
    // Тест загрузки файла
  });

  it("should handle duplicate files", async () => {
    // Тест дедупликации
  });
});
```

## Рекомендации по разработке

### 1. Обработка ошибок

- Используйте встроенные HTTP исключения NestJS
- Логируйте все ошибки с контекстом
- Возвращайте понятные сообщения об ошибках

### 2. Валидация

- Используйте class-validator для DTO
- Проверяйте размер и тип файлов
- Валидируйте TTL (минимум 1 минута, максимум 7 дней)

### 3. Производительность

- Используйте стримы для больших файлов
- Кэшируйте метаданные в памяти
- Оптимизируйте операции с файловой системой

### 4. Безопасность

- Ограничивайте размер загружаемых файлов
- Проверяйте MIME типы
- Используйте безопасные имена файлов
- Валидируйте все входные данные

## Развертывание

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### Docker Compose

```yaml
version: "3.8"

services:
  micro-file-cache:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - STORAGE_DIR=/app/storage
      - DATA_DIR=/app/data
    volumes:
      - file-storage:/app/storage
      - file-data:/app/data

volumes:
  file-storage:
  file-data:
```

## Мониторинг и логирование

### Логирование

- Используйте встроенный Logger NestJS
- Логируйте все операции с файлами
- Добавьте метрики производительности

### Health Check

```typescript
@Get('health')
getHealth() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

## Следующие шаги

1. Создайте базовую структуру проекта
2. Настройте package.json и зависимости
3. Реализуйте StorageModule
4. Создайте FilesModule с API endpoints
5. Добавьте CleanupModule с cron job
6. Напишите тесты
7. Создайте Dockerfile и docker-compose.yml
8. Настройте CI/CD pipeline
