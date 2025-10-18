# micro-stt

**Version:** 0.12.2

High-performance Speech-to-Text (STT) microservice built with NestJS + Fastify. Provides synchronous audio transcription via URL using AssemblyAI provider.

## Features

- 🎯 **Synchronous transcription** - Transcribe audio files via URL
- 🔌 **Multiple STT providers** - Currently supports AssemblyAI (extensible architecture)
- 🔐 **Built-in authentication** - Optional Bearer token authorization
- 📚 **OpenAPI/Swagger documentation** - Interactive API documentation
- 🏥 **Health checks** - Kubernetes-ready readiness and liveness probes
- 🛡️ **Centralized error handling** - Consistent error responses
- 📊 **Structured logging** - Production-ready JSON logging with Pino
- ⚡ **High performance** - Powered by Fastify
- 🐳 **Docker support** - Production-ready containerization
- 🔒 **SSRF protection** - Built-in security against Server-Side Request Forgery

## Quick Start

### Using Docker (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd micro-stt

# 2. Configure environment
cp env.production.example .env.production
# Edit .env.production with your settings

# 3. Run with Docker Compose
docker compose up --build
```

### Manual Installation

Requirements:

- Node.js 22+
- pnpm 10+

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp env.production.example .env.production
# Edit .env.production with your API keys and tokens

# 3. Build the project
pnpm build

# 4. Start the service
NODE_ENV=production pnpm start:prod
```

The service will be available at `http://0.0.0.0:80` by default (configurable via `LISTEN_HOST` and `LISTEN_PORT` environment variables). For local development, use `LISTEN_HOST=localhost` and `LISTEN_PORT=3000` in your `.env.development` file.

## Configuration

The service uses environment-specific configuration files:

- `.env.production` - Production environment
- `.env.development` - Development environment
- `.env` - Fallback configuration

### Essential Environment Variables

#### Application Settings

| Variable        | Description      | Default      | Development Example | Production Example |
| --------------- | ---------------- | ------------ | ------------------- | ------------------ |
| `NODE_ENV`      | Environment mode | `production` | `development`       | `production`       |
| `LISTEN_HOST`   | Server host      | `0.0.0.0`    | `localhost`         | `0.0.0.0`          |
| `LISTEN_PORT`   | Server port      | `80`         | `3000`              | `80`               |
| `API_BASE_PATH` | Base API path    | `api`        | `api`               | `api`              |
| `API_VERSION`   | API version      | `v1`         | `v1`                | `v1`               |

#### Authentication

| Variable       | Description                          | Required                 | Default |
| -------------- | ------------------------------------ | ------------------------ | ------- |
| `AUTH_ENABLED` | Enable Bearer token authentication   | No                       | `false` |
| `AUTH_TOKENS`  | Comma-separated list of valid tokens | When `AUTH_ENABLED=true` | -       |

**Authentication modes:**

- `AUTH_ENABLED=false` (default): No authentication required. Use when you have external authentication (API Gateway, reverse proxy, service mesh).
- `AUTH_ENABLED=true`: Built-in Bearer token authentication. Requires `AUTH_TOKENS` to be set.

#### STT Provider Settings

| Variable                  | Description                         | Default      | Recommended  |
| ------------------------- | ----------------------------------- | ------------ | ------------ |
| `ASSEMBLYAI_API_KEY`      | AssemblyAI API key                  | -            | Required\*   |
| `STT_DEFAULT_PROVIDER`    | Default provider                    | `assemblyai` | `assemblyai` |
| `STT_ALLOWED_PROVIDERS`   | Allowed providers (comma-separated) | `assemblyai` | `assemblyai` |
| `STT_MAX_FILE_SIZE_MB`    | Max file size in MB                 | `100`        | `100`        |
| `STT_REQUEST_TIMEOUT_SEC` | HTTP request timeout                | `15`         | `15-30`      |
| `STT_POLL_INTERVAL_MS`    | Status polling interval             | `1500`       | `1500`       |
| `STT_MAX_SYNC_WAIT_MIN`   | Max synchronous wait time           | `3`          | `3-5`        |
| `ALLOW_CUSTOM_API_KEY`    | Allow custom API keys in requests   | `false`      | `false`      |

\* Required when `ALLOW_CUSTOM_API_KEY=false`

#### Logging

| Variable    | Description      | Values                          | Production |
| ----------- | ---------------- | ------------------------------- | ---------- |
| `LOG_LEVEL` | Logging level    | `debug`, `log`, `warn`, `error` | `warn`     |
| `TZ`        | Process timezone | Any valid TZ                    | `UTC`      |

📖 **Detailed documentation:** See [docs/ENV_SETUP.md](docs/ENV_SETUP.md)

## API Documentation

Interactive Swagger documentation is available after starting the service:

```
http://localhost:3000/api/docs
```

> **Note:** Examples in this documentation use `localhost:3000` which is typical for development. In production, use your configured `LISTEN_HOST` and `LISTEN_PORT` (default: `0.0.0.0:80`).

The Swagger UI provides:

- Complete endpoint descriptions
- Interactive API testing
- Request/response examples
- Error documentation
- OpenAPI specification export: `http://localhost:3000/api/docs-json`

📖 **More details:** [docs/SWAGGER.md](docs/SWAGGER.md)

## API Endpoints

The service exposes the following endpoints (default prefix: `/api/v1`):

### Index

**GET** `/{API_BASE_PATH}/{API_VERSION}`

Returns API information and available endpoints.

**Response example:**

```json
{
  "name": "micro-stt",
  "version": "0.12.2",
  "status": "ok",
  "time": "2025-10-18T10:00:00Z",
  "links": {
    "self": "/api/v1",
    "docs": "/api/docs",
    "health": "/api/v1/health",
    "transcriptions": "/api/v1/transcriptions"
  }
}
```

### Health Checks

**GET** `/{API_BASE_PATH}/{API_VERSION}/health` - Full health check
**GET** `/{API_BASE_PATH}/{API_VERSION}/health/ready` - Readiness probe (Kubernetes)
**GET** `/{API_BASE_PATH}/{API_VERSION}/health/live` - Liveness probe (Kubernetes)

**Response example:**

```json
{
  "status": "ok",
  "info": { "service": { "status": "up" } },
  "error": {},
  "details": { "service": { "status": "up" } }
}
```

Health endpoints are always public and don't require authentication.

### Transcription

**POST** `/{API_BASE_PATH}/{API_VERSION}/transcriptions/file`

Synchronously transcribes audio file from URL.

**Authentication:** Required when `AUTH_ENABLED=true` (Bearer token in `Authorization` header)

**Request body:**

```json
{
  "audioUrl": "https://example.com/audio.mp3",
  "provider": "assemblyai",
  "timestamps": false,
  "apiKey": "your-api-key"
}
```

**Parameters:**

- `audioUrl` (required): URL of the audio file to transcribe
- `provider` (optional): STT provider to use (default: `assemblyai`)
- `timestamps` (optional): Include word-level timestamps (default: `false`)
- `apiKey` (optional): Custom provider API key (only when `ALLOW_CUSTOM_API_KEY=true`)

**Response (200 OK):**

```json
{
  "text": "Transcribed text from the audio file...",
  "provider": "assemblyai",
  "requestId": "abc123-def456-ghi789",
  "durationSec": 123.45,
  "language": "en",
  "confidenceAvg": 0.92,
  "wordsCount": 204,
  "processingMs": 8421,
  "timestampsEnabled": false
}
```

## Usage Examples

### Basic Request (No Authentication)

When `AUTH_ENABLED=false`:

```bash
curl -X POST \
  http://localhost:3000/api/v1/transcriptions/file \
  -H 'Content-Type: application/json' \
  -d '{
    "audioUrl": "https://example.com/audio.mp3"
  }'
```

### With Authentication

When `AUTH_ENABLED=true`:

```bash
curl -X POST \
  http://localhost:3000/api/v1/transcriptions/file \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -d '{
    "audioUrl": "https://example.com/audio.mp3"
  }'
```

### With Custom API Key

When `ALLOW_CUSTOM_API_KEY=true`:

```bash
curl -X POST \
  http://localhost:3000/api/v1/transcriptions/file \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -d '{
    "audioUrl": "https://example.com/audio.mp3",
    "apiKey": "YOUR_ASSEMBLYAI_KEY"
  }'
```

### With Word-Level Timestamps

```bash
curl -X POST \
  http://localhost:3000/api/v1/transcriptions/file \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -d '{
    "audioUrl": "https://example.com/audio.mp3",
    "timestamps": true
  }'
```

## Authentication

### Default: No Authentication

By default, built-in authentication is **disabled** (`AUTH_ENABLED=false`). This allows you to use external authentication mechanisms such as:

- API Gateway (Kong, AWS API Gateway, Azure API Management)
- Reverse proxy (nginx, Traefik, Envoy)
- Service mesh (Istio, Linkerd)
- Corporate network security

### Enabling Built-in Authentication

To enable Bearer token authentication:

1. Set `AUTH_ENABLED=true` in your environment configuration
2. Set `AUTH_TOKENS` with one or more comma-separated tokens
3. Include the token in the `Authorization` header for all transcription requests

**Example configuration:**

```bash
AUTH_ENABLED=true
AUTH_TOKENS=token1,token2,secret-key-123
```

**Making authenticated requests:**

```bash
Authorization: Bearer YOUR_TOKEN
```

### Protected Endpoints

When authentication is enabled, the following endpoints require a valid token:

- `POST /api/v1/transcriptions/file`

### Public Endpoints

These endpoints are always public:

- `GET /api/v1` (index)
- `GET /api/v1/health*` (all health check endpoints)

📖 **Detailed authentication guide:** [docs/AUTH.md](docs/AUTH.md)

## Response Codes

| Code                      | Description                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `200 OK`                  | Transcription completed successfully                                                       |
| `400 Bad Request`         | Invalid parameters (invalid URL, unsupported provider, file too large, private host, etc.) |
| `401 Unauthorized`        | Missing or invalid authorization token, or missing provider API key                        |
| `503 Service Unavailable` | Transcription service unavailable or provider error                                        |
| `504 Gateway Timeout`     | Transcription timeout exceeded                                                             |

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Detailed error description",
  "error": "Error type"
}
```

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Create environment file:**

   ```bash
   cp env.production.example .env.production
   ```

2. **Configure your settings in `.env.production`:**
   - Set `AUTH_TOKENS` if using authentication
   - Set `ASSEMBLYAI_API_KEY`
   - Adjust other settings as needed

3. **Build and run:**
   ```bash
   docker compose up --build
   ```

The service will be available on the configured `LISTEN_HOST` and `LISTEN_PORT`.

### Using Docker Directly

```bash
# Build the image
docker build -t micro-stt .

# Run the container
docker run -d \
  -p 3000:80 \
  -e NODE_ENV=production \
  -e TZ=UTC \
  -e AUTH_ENABLED=true \
  -e AUTH_TOKENS=your-token-here \
  -e ASSEMBLYAI_API_KEY=your-api-key-here \
  --name micro-stt \
  micro-stt
```

### Health Check Configuration

For Kubernetes deployments:

```yaml
livenessProbe:
  httpGet:
    path: /api/v1/health/live
    port: 80
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /api/v1/health/ready
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 10
```

## Logging

The service uses **Pino** for high-performance structured logging.

### Log Levels

- `debug` - Detailed debugging information (development)
- `info` - General informational messages
- `warn` - Warning messages (recommended for production)
- `error` - Error messages

### Log Formats

**Development mode** (`NODE_ENV=development`):

- Human-readable format with timestamps in UTC
- Includes full context and details

**Production mode** (`NODE_ENV=production`):

- JSON format for log aggregation
- Includes `@timestamp` field in ISO 8601 UTC format
- Compatible with ELK Stack, Grafana Loki, AWS CloudWatch

**Example production log:**

```json
{
  "level": 30,
  "@timestamp": "2025-10-18T14:30:45.123Z",
  "service": "micro-stt",
  "environment": "production",
  "req": {
    "method": "POST",
    "url": "/api/v1/transcriptions/file"
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 5666,
  "msg": "request completed"
}
```

### Security

Sensitive data is automatically redacted from logs:

- Authorization headers
- API keys
- Query parameters (removed from URLs)

📖 **Complete logging documentation:** [docs/LOGGING.md](docs/LOGGING.md)

## Security Considerations

### SSRF Protection

The service includes built-in protection against Server-Side Request Forgery:

- Only `http` and `https` protocols are allowed
- Localhost addresses are blocked (`localhost`, `127.0.0.1`, `::1`)
- Private IP ranges are blocked

### Authentication Best Practices

When using built-in authentication:

1. **Generate strong tokens:** Use cryptographically secure random generators
2. **Token length:** Minimum 32 characters recommended
3. **Secure storage:** Store tokens in secure secret management systems
4. **HTTPS only:** Always use HTTPS in production
5. **Token rotation:** Regularly rotate authentication tokens
6. **Monitoring:** Track failed authentication attempts in logs

**Generate secure token:**

```bash
# Linux/macOS
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Production Recommendations

1. Enable authentication or use external auth mechanisms
2. Use HTTPS with valid certificates
3. Set appropriate `LOG_LEVEL` (warn or error)
4. Configure reverse proxy with rate limiting
5. Monitor logs for suspicious activity
6. Keep dependencies updated
7. Use containerization for isolation

## Limitations and Notes

- **Synchronous operation:** HTTP requests block until transcription completes or timeout occurs
- **File size checking:** Only validated when source provides `Content-Length` header
- **Maximum wait time:** Configurable via `STT_MAX_SYNC_WAIT_MIN` (default: 3 minutes)
- **Provider support:** Currently only AssemblyAI is supported (architecture allows easy extension)

## Troubleshooting

### Service won't start

**Check environment variables:**

- When `AUTH_ENABLED=true`, ensure `AUTH_TOKENS` is set and not empty
- When `ALLOW_CUSTOM_API_KEY=false`, ensure `ASSEMBLYAI_API_KEY` is set
- Verify `NODE_ENV` is set to valid value (`production`, `development`, or `test`)

**Check logs:**

```bash
# Docker
docker logs micro-stt

# Direct run
# Logs will be in stdout/stderr
```

### 401 Unauthorized errors

- Verify `Authorization: Bearer <token>` header is included (when `AUTH_ENABLED=true`)
- Ensure token matches one of the values in `AUTH_TOKENS`
- Check that provider API key is configured (when `ALLOW_CUSTOM_API_KEY=false`)

### 503 Service Unavailable

- Verify `ASSEMBLYAI_API_KEY` is valid
- Check internet connectivity to AssemblyAI servers
- Review service logs for specific error messages

### Slow transcription

- Transcription time depends on audio file length and AssemblyAI processing
- Adjust `STT_MAX_SYNC_WAIT_MIN` if needed for longer files
- Monitor `processingMs` in responses to track performance

## Documentation

- [Authentication Guide](docs/AUTH.md) - Detailed Bearer token authentication documentation
- [Environment Setup](docs/ENV_SETUP.md) - Complete environment configuration guide
- [Logging](docs/LOGGING.md) - Logging architecture and best practices
- [Swagger/OpenAPI](docs/SWAGGER.md) - API documentation and Swagger UI guide
- [Development Guide](docs/DEVELOPMENT.md) - For developers working on the codebase
- [Changelog](docs/CHANGELOG.md) - Version history and changes

## Support

For issues, questions, or contributions, please refer to the [Development Guide](docs/DEVELOPMENT.md).

## License

MIT

---

**Version:** 0.12.2  
**Built with:** NestJS + Fastify  
**STT Provider:** AssemblyAI
