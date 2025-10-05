FROM postgres:18-alpine

# Переключаемся на root для установки пакетов
#USER root

# Устанавливаем musl-locales и tzdata для локалей и часового пояса
RUN apk add --no-cache musl-locales tzdata

# Настраиваем часовой пояс (пример для Москвы; измените по нужде)
#RUN cp /usr/share/zoneinfo/Europe/Moscow /etc/localtime && \
#    echo "Europe/Moscow" > /etc/timezone

# Устанавливаем переменные окружения для русской локали
ENV LANG=ru_RU.UTF-8
ENV LC_ALL=ru_RU.UTF-8
#ENV TZ=Europe/Moscow