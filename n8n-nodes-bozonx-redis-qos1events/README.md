# n8n Node: Redis Stream Producer

Community node for n8n that appends events to a Redis Stream using XADD.

Sections:

- [Installation](#installation)
- [How it works](#how-it-works)
- [Parameters](#parameters)
- [Credentials](#credentials)
- [Testing locally](#testing-locally)
- [Compatibility](#compatibility)
- [Notes](#notes)

## Installation

Follow the official community nodes installation guide: https://docs.n8n.io/integrations/community-nodes/installation/

## How it works

The node writes messages to a Redis Stream via the `XADD` command.

- Messages can be constructed in two modes:
  - JSON (single field): adds a single field named `data` containing `JSON.stringify($json)` of the input item.
  - Key-Value (from UI): uses key-value pairs defined in the node UI (you can add multiple pairs). The input item JSON is not used.
- Message ID can be set explicitly or left as `*` to auto-generate.
- Optional stream trimming with `MAXLEN ~ N` (disabled by default, set a number > 0 to enable).
- Optional stream key TTL using `EXPIRE <stream> <ttlSeconds>`.

Delivery semantics for consumers are determined by how subscribers read the stream:

- For “at-least-one” delivery, use Redis Consumer Groups (`XREADGROUP`) and acknowledge with `XACK`.
- To deliver to multiple independent subscriber groups, create multiple Consumer Groups. The producer only appends once.

## Parameters

- Stream Key (string, required)
  Redis Stream key to append messages to, e.g. `events:stt`. Default: `events:default`.

- Message ID (string)
  `*` by default. Set a fixed ID for idempotency if required.

- Payload Mode (options)
  - JSON (single field): send one field `data` with `JSON.stringify($json)`.
  - Key-Value (from UI): build fields from the UI `Payload` collection.

- Payload (collection)
  Only used when Payload Mode = Key-Value. Add multiple key-value pairs. Values are stored as strings.

- Max Stream Length (number)
  If > 0, enables `XADD MAXLEN ~ N` to approximately trim the stream to about N newest entries. Leave 0 to disable trimming. Typical values: thousands to millions depending on retention needs.

- Stream TTL (seconds, number)
  If > 0, executes `EXPIRE <stream> <ttlSeconds>` after the append.

## Credentials

Use the `Redis (Streams)` credentials with the following fields:

- Host (string, required)
- Port (number, required)
- Username (string, optional)
- Password (string, optional)
- TLS (boolean)
- DB Index (number, default 0)

## Testing locally

You can use the provided Docker Compose file to spin up Redis and RedisInsight:

1. Run: `docker compose up -d` in the package folder
2. Create a consumer group (example):
   - `redis-cli XGROUP CREATE mystream mygroup $ MKSTREAM`
3. Run the node in an n8n workflow and then read from the group:
   - `redis-cli XREADGROUP GROUP mygroup c1 COUNT 10 STREAMS mystream >`
   - Acknowledge: `redis-cli XACK mystream mygroup <id>`

## Compatibility

Built and tested with n8n `1.60.0+`.

## Notes

- MAXLEN uses the approximate form `~` for better performance.
- If consumers fall behind and MAXLEN is small, older messages may be trimmed before processing. Choose N with headroom.
- Exact once-only delivery is not guaranteed by streams. Use idempotent logic with fixed IDs if needed.

---

# n8n Node: Bozonx STT Gateway Microservice

Community node for n8n that performs synchronous speech-to-text transcription from a public audio URL via the STT Gateway microservice (default provider: AssemblyAI).

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

Sections:

- [Installation](#installation)
- [How it works](#how-it-works)
- [Parameters](#parameters)
- [Credentials](#credentials)
- [Advanced](#advanced)
- [Compatibility](#compatibility)
- [Resources](#resources)

## Installation

Follow the official community nodes installation guide: https://docs.n8n.io/integrations/community-nodes/installation/

## How it works

The node sends a POST request to the microservice endpoint:

```
POST {{gatewayUrl}}/{{basePath}}/transcriptions/file
Content-Type: application/json

{
  "audioUrl": "https://example.com/audio.mp3",
  "provider": "assemblyai",  
  "timestamps": false,
  "restorePunctuation": true,
  "apiKey": "YOUR_ASSEMBLYAI_KEY"
}
```

- `gatewayUrl` comes from Credentials. It must include protocol (http/https) and have no trailing slash.
- `basePath` is a node parameter. Leading/trailing slashes are ignored. Default: `stt/api/v1`.
- Authentication is done via the `Authorization: Bearer <token>` header provided by Credentials.

### Example successful response (200)

```json
{
  "text": "Transcribed text...",
  "provider": "assemblyai",
  "requestId": "abc123",
  "durationSec": 123.45,
  "language": "en",
  "confidenceAvg": 0.92,
  "wordsCount": 204,
  "processingMs": 8421,
  "timestampsEnabled": false,
  "punctuationRestored": true
}
```

## Parameters

- **Base Path** (string)
  Default: `stt/api/v1`. Appended to the Gateway URL. Leading/trailing slashes are ignored.

- **Audio URL** (string, required)
  Public HTTPS URL to the audio file.

- **Provider** (options, optional)
  Speech-to-text provider. If omitted, the microservice uses its default provider. Available: `assemblyai`.

- **Timestamps** (boolean)
  Include word-level timestamps in provider request (if supported). Default: `false`.

- **Restore Punctuation** (boolean)
  Ask the provider to restore punctuation when supported. Default: `true`.

- **Provider API Key** (string, optional)
  Direct provider API key (BYO) when allowed by service policy.

## Credentials

Use the `Bozonx Microservices API` credentials:

- **Gateway URL** (required)
  Base URL of your API Gateway, without the base path (no trailing slash). Example: `https://api.example.com`.

- **API Token** (required)
  Bearer token added to the `Authorization` header.

You can use expressions and environment variables, e.g.:

- Gateway URL: `{{$env.API_GATEWAY_URL}}`
- API Token: `{{$env.API_TOKEN}}`

## Advanced

- **Continue On Fail** is supported in the node Settings. On error the item will return `{ "error": "..." }` and processing will continue for other items.
- Default headers include `Accept: application/json`. Request body is JSON.

## Compatibility

Built and tested with n8n `1.60.0+`.

## Resources

- Service docs and API reference: see the repository root `README.md` and `docs/API.md`.
- n8n community nodes docs: https://docs.n8n.io/integrations/#community-nodes
