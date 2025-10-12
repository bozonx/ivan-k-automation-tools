# Документация для разработчиков

Добро пожаловать в документацию для разработчиков micro-file-cache!

## 📚 Содержание

### 🧪 Тестирование

- **[E2E_TESTING.md](E2E_TESTING.md)** - подробное руководство по End-to-End тестированию
- **[E2E.md](E2E.md)** - краткое описание E2E тестов

### 🏗️ Архитектура и модули

- **[STORAGE_MODULE.md](STORAGE_MODULE.md)** - документация модуля файлового хранилища
- **[DTO_DOCUMENTATION.md](DTO_DOCUMENTATION.md)** - документация DTO классов

### 📝 История разработки

- **[CHANGELOG.md](CHANGELOG.md)** - история изменений проекта
- **[STAGE_17_COMPLETION_REPORT.md](STAGE_17_COMPLETION_REPORT.md)** - отчет о завершении этапа разработки

## 🎯 Для кого эта документация

Эта документация предназначена для:

- **Разработчиков** - работающих с кодом micro-file-cache
- **Архитекторов** - изучающих внутреннюю структуру системы
- **Тестировщиков** - настраивающих и запускающих тесты
- **DevOps инженеров** - развертывающих и поддерживающих сервис

## 🚀 Быстрый старт для разработчиков

### 1. Настройка окружения разработки

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd micro-file-cache

# Установите зависимости
pnpm install

# Настройте окружение
cp env.dev .env
```

### 2. Запуск в режиме разработки

```bash
# Запуск с hot reload
pnpm run start:dev

# Или через Docker
docker-compose --profile dev up -d
```

### 3. Запуск тестов

```bash
# Unit тесты
pnpm run test

# E2E тесты
pnpm run test:e2e

# Покрытие кода
pnpm run test:cov
```

## 🏗️ Архитектура проекта

### Структура модулей

```
src/
├── common/           # Общие компоненты
│   ├── guards/       # Аутентификация
│   ├── decorators/   # Декораторы
│   ├── filters/      # Фильтры исключений
│   ├── pipes/        # Пайпы валидации
│   └── interfaces/   # Интерфейсы
├── modules/          # Модули приложения
│   ├── files/        # Работа с файлами
│   ├── storage/      # Файловое хранилище
│   └── cleanup/      # Автоматическая очистка
└── config/           # Конфигурация
```

### Основные компоненты

- **FilesModule** - обработка HTTP запросов для работы с файлами
- **StorageModule** - управление файловым хранилищем и метаданными
- **CleanupModule** - автоматическая очистка устаревших файлов

## 🧪 Тестирование

### Типы тестов

1. **Unit тесты** (`test/unit/`) - тестирование отдельных сервисов и методов
2. **E2E тесты** (`test/e2e/`) - тестирование полного API с помощью supertest
3. **Integration тесты** - тестирование взаимодействия между модулями

### Запуск тестов

```bash
# Все тесты
pnpm run test

# Только unit тесты
pnpm run test:unit

# Только E2E тесты
pnpm run test:e2e

# Тесты с покрытием
pnpm run test:cov

# Тесты в watch режиме
pnpm run test:watch
```

### Конфигурация тестов

- **Jest** - основной фреймворк для тестирования
- **Supertest** - для E2E тестирования HTTP API
- **Test конфигурация** - `env.test` для тестового окружения

## 🔧 Разработка

### Добавление новых функций

1. **Создайте feature branch**:

   ```bash
   git checkout -b feature/new-feature
   ```

2. **Напишите тесты**:
   - Unit тесты для новой функциональности
   - E2E тесты для API endpoints

3. **Реализуйте функциональность**:
   - Следуйте архитектурным принципам
   - Используйте существующие паттерны

4. **Проверьте качество кода**:
   ```bash
   pnpm run lint
   pnpm run test
   pnpm run test:e2e
   ```

### Стандарты кодирования

- **TypeScript** - строгая типизация
- **ESLint** - линтинг кода
- **Prettier** - форматирование кода
- **Conventional Commits** - стандарт коммитов

### Git workflow

1. **Feature branches** - для новых функций
2. **Pull requests** - для code review
3. **Conventional commits** - для автоматической генерации changelog

## 📊 Мониторинг и отладка

### Логирование

```bash
# Разные уровни логирования
LOG_LEVEL=debug  # Подробные логи
LOG_LEVEL=info   # Информационные логи
LOG_LEVEL=error  # Только ошибки
```

### Отладка

```bash
# Запуск с отладкой
pnpm run start:debug

# Или через Docker
docker-compose --profile dev up -d
docker-compose logs -f micro-file-cache-dev
```

## 🚀 Развертывание

### Docker

```bash
# Продакшн сборка
docker-compose up -d

# Разработка
docker-compose --profile dev up -d
```

### Переменные окружения

- **env.dev** - для разработки
- **env.docker** - для Docker
- **env.test** - для тестов

## 📚 Дополнительные ресурсы

### Пользовательская документация

- **[../docs/README.md](../docs/README.md)** - документация для пользователей
- **[../docs/architecture.md](../docs/architecture.md)** - архитектура системы

### Внешние ресурсы

- **[NestJS Documentation](https://docs.nestjs.com/)** - документация фреймворка
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - руководство по TypeScript
- **[Jest Documentation](https://jestjs.io/docs/getting-started)** - документация по тестированию

## 🤝 Участие в разработке

### Как внести вклад

1. **Fork репозитория**
2. **Создайте feature branch**
3. **Внесите изменения**
4. **Напишите тесты**
5. **Создайте Pull Request**

### Code Review

- Все изменения проходят code review
- Тесты должны проходить
- Код должен соответствовать стандартам

---

**Удачной разработки!** 🚀
