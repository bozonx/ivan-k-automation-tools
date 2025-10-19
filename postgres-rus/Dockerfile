FROM postgres:18-alpine

RUN apk add --no-cache musl-locales tzdata

# Install build dependencies and PostgreSQL extensions
RUN apk add --no-cache groonga groonga-dev \
    && apk add --no-cache --virtual .build-deps \
    git \
    build-base \
    clang15 \
    llvm15 \
    # Build pgvector
    && git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && make \
    && make install \
    && cd / \
    && rm -rf /tmp/pgvector \
    # Build PGroonga
    && git clone --depth 1 --branch v3.2.6 https://github.com/pgroonga/pgroonga.git /tmp/pgroonga \
    && cd /tmp/pgroonga \
    && make \
    && make install \
    && cd / \
    && rm -rf /tmp/pgroonga \
    # Clean up build dependencies
    && apk del .build-deps

ENV LANG=ru_RU.UTF-8
ENV LC_ALL=ru_RU.UTF-8
