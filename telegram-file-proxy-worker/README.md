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
  - Key generation: Use a secure random 32-byte key.
    - In Node.js: `crypto.randomBytes(32).toString('base64')` (then prefix `base64:`)
    - In shell: `openssl rand -base64 32` (then prefix `base64:`)
    - Or use `hex:` with `openssl rand -hex 32`
- TIMEOUT_SECS: optional, default `60` seconds. Aborts the origin request on timeout.
- MAX_MEGABYTES: optional, if set to a positive integer (in MB):
  - If origin `Content-Length` is known and larger -> respond `413`.
  - Otherwise, stream is capped at `MAX_MEGABYTES * 1024 * 1024` bytes and `content-length` is removed.

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
