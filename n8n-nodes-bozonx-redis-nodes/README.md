# n8n Nodes: Bozonx Redis Nodes (Cache + Streams)

Community nodes for n8n to work with Redis:

- Redis Cache: read/write JSON values with optional TTL
- Redis Pub: append entries to Redis Streams (XADD)
- Redis Stream Trigger: emit items from Redis Streams (XREAD)

n8n is a fair-code licensed workflow automation platform: https://n8n.io/

## Installation

Follow the official community nodes installation guide: https://docs.n8n.io/integrations/community-nodes/installation/

Package name: `n8n-nodes-bozonx-redis-nodes`

## Credentials

All nodes use the same credentials: Redis

- Host (default: `localhost`)
- Port (default: `6379`)
- Username (optional)
- Password (optional)
- TLS (boolean)
- DB Index (default: `0`)

You can use expressions and env vars, e.g. `{{$env.REDIS_HOST}}`, `{{$env.REDIS_PASSWORD}}`.

## Nodes

### 1) Redis Cache

- Mode: Write or Read
- Key: Redis key
- Write → Payload Type: JSON or Custom Fields
- TTL: value + unit (0 disables expiration)

Write result: `{ ok: true, key, ttlSeconds, data }`

Read result hit: `{ found: true, key, data }`

Read result miss: `{ found: false, key }`

Details:
- When Payload Type is JSON, a valid JSON string is required.
- When Payload Type is Data Fields, you can add multiple fields with a selected value type (string, number, boolean, json, null). JSON values are validated and stringified.
- TTL is optional; set to 0 to store without expiration. Units supported: seconds, minutes, hours, days.

### 2) Redis Pub (Streams)

- Event name: Redis stream key
- Payload Mode: Text, JSON, or Key-Value
- Stream trimming: `MAXLEN ~ 1000000`
- Stream TTL: `EXPIRE 86400` seconds

Output item example:

```json
{ "payload": <parsed_payload>, "_stream": "mystream", "_id": "1728666000000-0" }
```

Details:
- Text mode sends a single field "payload" with the provided text.
- JSON mode sends a single field "data". If left empty, the incoming item is used and stringified.
- Key-Value mode lets you define typed fields (string, number, boolean, json, null). Invalid JSON values are rejected.

### 3) Redis Stream Trigger (Streams)

- Stream Key
- Allowed Stale (Seconds): if > 0, on start emit recent entries; 0 → only new
- Blocking read: `BLOCK 10000`, batch size: `COUNT 50`
- Persists last ID in workflow static data

Emitted item example:

```json
{ "payload": <parsed_payload_or_fields>, "_stream": "mystream", "_id": "1728666000000-0" }
```

## Quick Start

1. Create Redis credentials in n8n
2. Redis Cache (Write): set key, payload JSON, TTL
3. Redis Cache (Read): set same key
4. Redis Pub: set stream key and payload
5. Redis Stream Trigger: set same stream key, optional Allowed Stale

## Usage Examples

- Redis Cache (Write JSON):
  - Mode: Write
  - Key: `cache:user:42`
  - Payload Type: JSON
  - Data: `{ "id": 42, "name": "Ada" }`
  - TTL Unit: hours, TTL Value: 24

- Redis Cache (Read):
  - Mode: Read
  - Key: `cache:user:42`

- Redis Pub (JSON):
  - Stream Key: `my-service:main`
  - Payload Mode: JSON
  - Payload: leave empty to send the incoming item as JSON

- Redis Stream Trigger:
  - Stream Key: `my-service:main`
  - Allowed Stale (Seconds): `0` for only new entries

## Development

- Install deps: `pnpm install`
- Lint: `pnpm lint`
- Build: `pnpm build`
- Dev (watch): `pnpm dev` or `pnpm run build:watch`

Before publishing, the CLI will run `n8n-node prerelease` automatically.

Publishing options:
- n8n Community Node flow: `pnpm release:n8n`
- Plain npm publish (without n8n flow): see `dev_docs/publish.md`

## Compatibility

Built and tested with n8n 1.60.0+ and node-redis 5.x.

## License

MIT
