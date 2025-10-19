FROM postgres:18-alpine

RUN apk add --no-cache musl-locales tzdata

# Install pgvector dependencies and build extension
RUN apk add --no-cache --virtual .build-deps \
    git \
    build-base \
    clang15 \
    llvm15 \
    && git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && make \
    && make install \
    && cd / \
    && rm -rf /tmp/pgvector \
    && apk del .build-deps

ENV LANG=ru_RU.UTF-8
ENV LC_ALL=ru_RU.UTF-8
