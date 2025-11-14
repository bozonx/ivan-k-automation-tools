# Cloudflare Function: Encrypted URL Proxy

Goal
- Accept an encrypted message at the root HTTP route and proxy the resource located at the decrypted URL.
- Encryption: AES-256-CBC. The encrypted payload is base64-encoded.
- The symmetric key is provided via environment variable.

High-level Flow
1) Client sends an HTTP request to `/` with an encrypted payload.
2) Worker decodes base64, parses the container to get IV and ciphertext, decrypts using AES-256-CBC with the env key.
3) The decrypted plaintext contains a destination URL (`https://...`).
4) Worker fetches the destination URL from the edge and streams the origin response back to the client.
5) On any failure, respond with a minimal JSON error (no sensitive details).

API Contract
- Method: GET and POST supported for flexibility.
  - GET: `/ ? q=<base64(encrypted_container)>`
  - POST: `/` with JSON body `{ "q": "<base64(encrypted_container)>" }` or raw text body containing the same string.
- Response: Proxied origin response with status, body, and selected headers.
- Errors: JSON body `{ "error": "..." }` with appropriate status code.

Encryption Container Format
- Cipher: AES-256-CBC
- Key: 32-byte key (256-bit). See Env Variables section for encoding.
- IV: 16 bytes.
- Container (canonical): base64 of JSON string with fields:
  ```json
  {
    "iv": "<base64-iv>",
    "data": "<base64-ciphertext>"
  }
  ```
- Notes:
  - Using a JSON container avoids delimiter ambiguity and makes future extension easier (e.g., adding HMAC).
  - The decrypted plaintext MUST be an absolute URL (http/https). See Security.
  - передаются все заголовки как есть как в прозрачном обратном прокси, ограничений по хостам нет
  - добавь переменную окружения на размер тела ответа

Environment Variables
- KEY: required. The AES key (choose one of the formats):
  - `base64:<base64-encoded-32-bytes>` or `hex:<64-hex-chars>` or `raw` 32 bytes via secret (not recommended unless managed carefully).
  - The function will detect prefix `base64:` or `hex:` and decode accordingly; otherwise assumes raw bytes.
- TIMEOUT_MS (optional): per-origin request timeout (default 15000 ms).

Worker Behavior (Pseudocode)
1) Parse request (GET query `q` or POST body) -> `enc` string.
2) If missing/empty -> 400.
3) Decode base64 -> string; parse JSON -> `{iv, data}`.
4) Validate `iv` and `data` base64 -> Uint8Array.
5) Read KEY from env and normalize to 32-byte Uint8Array.
6) Decrypt using AES-256-CBC (SubtleCrypto in Workers or a small AES impl) -> plaintext string.
7) Validate `url` (must be `http:` or `https:`). Reject other schemes.
8) Perform `fetch(url, { method: 'GET', redirect: 'follow' })` with AbortSignal timeout.
9) Validate status
10) Return `new Response(stream, { status, headers })`.


Error Handling
- 400: missing/invalid `q`, invalid base64, invalid JSON container, invalid iv/data lengths.
- 401: missing KEY in environment.
- 403: URL fails allowlist or scheme checks.
- 408/504: timeout when fetching origin.
- 413: response exceeds MAX_BYTES.
- 502/504: network errors to origin.
- Error payload example: `{ "error": "Invalid payload" }`

Observability & Logs
- Minimal `console.error` on failures (mask secrets). Log origin URL host only (not full URL if sensitive).

Project Structure
```
telegram-file-proxy-function/
  ├─ dev_plan.md (this file)
  ├─ src/
  │   └─ index.ts (Request handler)
  ├─ package.json
  ├─ tsconfig.json
  ├─ wrangler.toml
  ├─ README.md
```

Implementation Notes
- использовать crypto то что для воркеров
- Streaming: Use `fetch(url)` result directly; clone headers to a new `Headers` and filter.
- Timeout: `AbortSignal.timeout(TIMEOUT_MS || 15000)` (Workers support). Fallback: manual timer.
- Size cap: Wrap `response.body` in a `new ReadableStream` counting bytes.

Testing Plan
- Unit-like tests (local Wrangler) with known key/iv/ciphertext vectors for:
  - Valid URL decryption -> 200, proxied body.
  - Invalid base64 -> 400.
  - Invalid JSON container -> 400.
  - Wrong key -> 400/403 (decryption fail -> invalid UTF-8 / invalid URL).
  - Disallowed host -> 403.
  - Timeout -> 504.
- End-to-end: point to a public test URL (e.g., https://httpbin.org/bytes/1024) and verify streaming + headers.

Deployment
- Wrangler config example (wrangler.toml):
  ```toml
  name = "telegram-file-proxy"
  main = "src/index.ts"
  compatibility_date = "2025-11-14"
  
  [vars]
  # Optional defaults
  TIMEOUT_MS = 15000
  FORWARD_HEADERS = "content-type,content-length,etag,last-modified,cache-control,accept-ranges,content-range"
  
  # No KEY here; set as secret
  ```
- Set secrets:
  ```bash
  wrangler secret put KEY
  wrangler secret put ALLOW_HOSTS   # optional
  wrangler secret put MAX_BYTES     # optional
  ```
- Publish:
  ```bash
  pnpm dlx wrangler deploy
  ```

Future Enhancements
- Add HMAC (AES-CBC is malleable). Recommended: envelope with `hmac` (e.g., HMAC-SHA256) over iv+ciphertext, verified by server.
