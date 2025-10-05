# Используем официальный образ Node.js LTS на базе Alpine Linux для минимального размера
FROM node:20-alpine

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

# Создаем пользователя для безопасности (не запускаем от root)
RUN addgroup -g 1001 -S webhook && \
    adduser -S webhook -u 1001 -G webhook

# Создаем необходимые директории
RUN mkdir -p /data/repos /data/compose && \
    chown -R webhook:webhook /data

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файл приложения
COPY --chown=webhook:webhook index.js ./

# Делаем файл исполняемым
RUN chmod +x index.js

# Переключаемся на пользователя webhook
USER webhook

# Открываем порт 80 (по умолчанию из index.js)
EXPOSE 80

# Устанавливаем переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=80

# Команда запуска приложения
CMD ["node", "index.js"]
