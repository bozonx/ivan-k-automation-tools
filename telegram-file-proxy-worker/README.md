# Telegram Encrypted URL Proxy (Cloudflare Worker)

Accepts base64-encoded AES-256-CBC container at the root route and proxies the decrypted URL.

## API
- GET: `/?q=<base64(JSON{iv,data})>`
- POST: `/` with JSON body `{ "q": "<base64(JSON{iv,data})>" }` or raw text body containing that string.

## Env
- KEY: AES-256 key. Formats: `base64:<...>`, `hex:<...>`, or raw 32-byte string.
- TIMEOUT_MS: optional, default 15000.

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
