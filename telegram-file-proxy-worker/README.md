# Telegram Encrypted URL Proxy (Cloudflare Worker)

Accepts base64-encoded AES-256-CBC container at the root route and proxies the decrypted URL.

## API
- GET only: `/?q=<base64(JSON{iv,data})>`
- Other methods: `405 Method Not Allowed`

Notes
- Decrypted URL is never included in responses or error bodies.
- Transparent reverse proxy: origin headers/body are returned as-is (except `content-length` is removed if size limiting is active).

## Env
- KEY: AES-256 key. Formats: `base64:<...>`, `hex:<...>`, or raw 32-byte string.
- TIMEOUT_MS: optional, default `15000` ms. Aborts the origin request on timeout.
- MAX_BYTES: optional, if set to a positive integer:
  - If origin `Content-Length` is known and larger -> respond `413`.
  - Otherwise, stream is capped at `MAX_BYTES` and `content-length` is removed.

## Run
```bash
pnpm i
pnpm dev
```

## Deploy
```bash
wrangler secret put KEY
pnpm deploy
```
