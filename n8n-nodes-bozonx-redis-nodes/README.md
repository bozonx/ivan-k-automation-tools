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

Write result: `{ ok: true, key, ttlSeconds }`

Read result hit: `{ found: true, key, value }`

Read result miss: `{ found: false, key }`

### 2) Redis Pub (Streams)

- Event name: Redis stream key
- Payload Mode: Text, JSON, or Key-Value
- Stream trimming: `MAXLEN ~ 1000000`
- Stream TTL: `EXPIRE 86400` seconds

Output item example:

```json
{ "payload": <parsed_payload>, "_stream": "mystream", "_id": "1728666000000-0" }
```

### 3) Redis Stream Trigger (Streams)

- Stream Key
- Allowed Stale (Seconds): if > 0, on start emit recent entries; 0 → only new
- Blocking read: `BLOCK 10000`, batch size: `COUNT 50`
- Persists last ID in workflow static data

## Quick Start

1. Create Redis credentials in n8n
2. Redis Cache (Write): set key, payload JSON, TTL
3. Redis Cache (Read): set same key
4. Redis Pub: set stream key and payload
5. Redis Stream Trigger: set same stream key, optional Allowed Stale

## Development

- Install deps: `pnpm install`
- Lint: `pnpm lint`
- Build: `pnpm build`
- Dev (watch): `pnpm dev` or `pnpm run build:watch`

Before publishing, the CLI will run `n8n-node prerelease` automatically.

## Compatibility

Built and tested with n8n 1.60.0+ and node-redis 5.x.
