FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Copy package files
COPY package.json ./

# Install deps
RUN pnpm install --frozen-lockfile --prefer-offline || pnpm install --prefer-offline

# Copy source
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Build
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV LISTEN_HOST=0.0.0.0
ENV LISTEN_PORT=80
ENV TZ=UTC

# Install pnpm in runtime for potential exec; not required to run
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Copy only runtime files
COPY package.json ./
RUN pnpm install --prod --frozen-lockfile --prefer-offline || pnpm install --prod --prefer-offline

COPY --from=builder /app/dist ./dist

EXPOSE 80

CMD ["node", "dist/main.js"]
