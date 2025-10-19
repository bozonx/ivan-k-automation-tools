FROM postgres:18

# Install system dependencies and locales
RUN apt-get update && apt-get install -y \
    ca-certificates \
    lsb-release \
    wget \
    locales \
    && rm -rf /var/lib/apt/lists/*

# Generate Russian locale
RUN echo "ru_RU.UTF-8 UTF-8" >> /etc/locale.gen && \
    locale-gen

# Add Groonga repository for Debian
RUN wget https://packages.groonga.org/debian/groonga-apt-source-latest-$(lsb_release --codename --short).deb \
    && apt-get install -y ./groonga-apt-source-latest-$(lsb_release --codename --short).deb \
    && rm groonga-apt-source-latest-$(lsb_release --codename --short).deb

# Update package lists and install PGroonga for PostgreSQL 18
# Note: PostgreSQL repository is already configured in the base image
RUN apt-get update && apt-get install -y \
    postgresql-18-pgdg-pgroonga \
    groonga-tokenizer-mecab \
    && rm -rf /var/lib/apt/lists/*

# Install pgvector extension
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    postgresql-server-dev-18 \
    && git clone --depth 1 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && make \
    && make install \
    && cd / \
    && rm -rf /tmp/pgvector \
    && apt-get remove -y git build-essential postgresql-server-dev-18 \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Set Russian locale
ENV LANG=ru_RU.UTF-8
ENV LC_ALL=ru_RU.UTF-8
ENV LC_CTYPE=ru_RU.UTF-8

# Set PostgreSQL locale
ENV POSTGRES_INITDB_ARGS="--locale=ru_RU.UTF-8"
