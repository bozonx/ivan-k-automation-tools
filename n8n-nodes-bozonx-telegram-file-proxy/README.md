# n8n-nodes-bozonx-telegram-file-proxy

n8n community node to encrypt Telegram file URLs for proxying through Cloudflare Worker.

## Use Case

Hide Telegram Bot token in file URLs when passing audio/video/document links to third-party services.

## Installation

```bash
npm install n8n-nodes-bozonx-telegram-file-proxy
```

Or install directly in n8n:
1. Go to **Settings** > **Community Nodes**
2. Install: `n8n-nodes-bozonx-telegram-file-proxy`

## Credentials

### Telegram File Proxy API

- **Telegram Bot Token**: Your bot token from @BotFather (e.g., `123456:ABC-DEF...`)
- **Worker URL**: Cloudflare Worker URL (e.g., `https://telegram-file-proxy.your-account.workers.dev`)
- **AES Key**: AES-256 key matching the worker's `KEY` secret. Formats:
  - `base64:...` (recommended)
  - `hex:...`

Generate key:
```bash
openssl rand -base64 32
```
Then prefix with `base64:` in both n8n credentials and worker secret.

## Node: Telegram File Proxy

### Parameters

- **File ID**: Telegram `file_id` from message (e.g., `AgACAgIAAxkBAAIBY2...`)

The node automatically calls Telegram's `getFile` API to get the `file_path` and builds the download URL.

### Output

Returns JSON with single field:
```json
{
  "encryptedUrl": "https://worker-url/?q=base64(encrypted_container)"
}
```

This URL can be passed to external services without exposing your bot token.

## Example Workflow

1. **Telegram Trigger** receives message with file → gets `file_id`
2. **Telegram File Proxy** node automatically calls `getFile` API, gets `file_path`, encrypts URL
3. **HTTP Request** sends `encryptedUrl` to speech-to-text service
4. Service fetches file via worker (token hidden)

## Related

- [telegram-file-proxy-worker](../telegram-file-proxy-worker) - Cloudflare Worker for decryption and proxying

## License

MIT
