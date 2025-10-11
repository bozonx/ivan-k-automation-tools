# Используем официальный образ Node.js 22 Alpine для минимального размера
FROM node:22-alpine AS builder

# Устанавливаем pnpm глобально
RUN npm install -g pnpm@10.13.1

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json pnpm-lock.yaml ./

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Копируем исходный код
COPY . .

# Собираем приложение
RUN pnpm run build

# Продакшн образ
FROM node:22-alpine AS production

# Устанавливаем pnpm глобально
RUN npm install -g pnpm@10.13.1

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json pnpm-lock.yaml ./

# Устанавливаем только продакшн зависимости
RUN pnpm install --frozen-lockfile --prod && \
    pnpm store prune

# Копируем собранное приложение из builder стадии
COPY --from=builder /app/dist ./dist

# Создаем директории для хранения файлов
RUN mkdir -p /app/storage && \
    chown -R nestjs:nodejs /app

# Переключаемся на непривилегированного пользователя
USER nestjs

# Открываем порт
EXPOSE 80

# Добавляем health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:80/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Запускаем приложение
CMD ["node", "dist/main.js"]
