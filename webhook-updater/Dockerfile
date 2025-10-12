# Используем официальный образ Node.js LTS на базе Alpine Linux для минимального размера
FROM node:22-alpine

# Устанавливаем метаданные образа
LABEL maintainer="ivan-k-automation-tools"
LABEL description="Webhook updater server with git and docker-compose support"

# Устанавливаем необходимые пакеты
# - git: для выполнения git pull операций
# - docker-compose: для управления docker-compose
# - docker-cli: для работы с Docker (требуется для docker-compose)
# - bash: для выполнения скриптов
RUN apk add --no-cache \
    git \
    docker-compose \
    docker-cli \
    bash \
    && rm -rf /var/cache/apk/*

# Используем существующего пользователя node (UID 1000) для безопасности
# Пользователь node уже существует в базовом образе node:20-alpine

# Создаем необходимые директории
RUN mkdir -p /data/repos /data/compose && \
    chown -R node:node /data

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файл приложения
COPY --chown=node:node index.js ./

# Делаем файл исполняемым
RUN chmod +x index.js

# Переключаемся на пользователя node
USER node

# Открываем порт 80 (по умолчанию из index.js)
EXPOSE 80

# Устанавливаем переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=80

# Команда запуска приложения
CMD ["node", "index.js"]
