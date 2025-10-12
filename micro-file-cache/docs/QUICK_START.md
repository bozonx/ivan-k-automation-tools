# Быстрый старт

## 1. Установка и настройка

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd micro-file-cache

# Установите зависимости
pnpm install

# Настройте переменные окружения для разработки
cp env.dev .env
```

## 2. Запуск

```bash
# Запустите в режиме разработки
pnpm run start:dev
```

Приложение будет доступно по адресу: `http://localhost:3000`

## 3. Тестирование

### Health check (без аутентификации)

```bash
curl http://localhost:3000/api/v1/health
```

### Защищенные endpoints (требуют токен)

```bash
# Список файлов
curl -H "Authorization: Bearer dev-secret-key-for-micro-file-cache-12345678901234567890" \
  http://localhost:3000/api/v1/files

# Загрузка файла
curl -X POST \
  -H "Authorization: Bearer dev-secret-key-for-micro-file-cache-12345678901234567890" \
  -F "file=@/path/to/your/file.txt" \
  -F "ttl=3600" \
  http://localhost:3000/api/v1/files
```

## 4. API документация

Swagger документация доступна по адресу: `http://localhost:3000/api/docs`

## 5. Отключение аутентификации

Для отключения аутентификации в файле `.env` установите:

```env
AUTH_ENABLED=false
```

## 6. Полезные команды

```bash
# Сборка проекта
pnpm run build

# Запуск тестов
pnpm run test

# Линтинг
pnpm run lint

# E2E тесты
pnpm run test:e2e
```

## 7. Структура проекта

```
src/
├── common/           # Общие компоненты
│   ├── guards/       # Guards (аутентификация)
│   ├── decorators/   # Декораторы
│   ├── controllers/  # Общие контроллеры
│   └── interfaces/   # Интерфейсы
├── modules/          # Модули приложения
│   ├── files/        # Работа с файлами
│   ├── storage/      # Файловое хранилище
│   └── cleanup/      # Автоматическая очистка
└── config/           # Конфигурация
```

## 8. Переменные окружения

Основные переменные для разработки:

- `AUTH_ENABLED=true` - включить аутентификацию (по умолчанию: true)
- `AUTH_SECRET_KEY=dev-secret-key-...` - секретный ключ (обязателен если AUTH_ENABLED=true, в production режиме минимум 32 символа)
- `LISTEN_PORT=3000` - порт приложения (по умолчанию: 3000)
- `LOG_LEVEL=debug` - уровень логирования

Полный список переменных см. в файле `env.example` или `ENV_SETUP.md`.
