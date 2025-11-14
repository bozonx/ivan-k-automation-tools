export interface Env {
  KEY_BASE64?: string
  TIMEOUT_SECS?: string | number
  MAX_MEGABYTES?: string | number
}

const textDecoder = new TextDecoder()

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    try {
      if (request.method !== 'GET') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'GET', 'content-type': 'text/plain; charset=utf-8' },
        })
      }
      const urlForHealth = new URL(request.url)
      if (urlForHealth.pathname === '/health') {
        return new Response('ok', {
          status: 200,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        })
      }

      const q = await extractQ(request)
      if (!q) return jsonError(400, "Missing 'q'")

      let containerStr: string
      try {
        containerStr = base64ToString(q)
      } catch {
        return jsonError(400, 'Invalid base64 container')
      }
      let parsed: { iv: string; data: string }
      try {
        parsed = JSON.parse(containerStr)
      } catch {
        return jsonError(400, 'Invalid container JSON')
      }

      if (!parsed?.iv || !parsed?.data) return jsonError(400, 'Missing iv/data')

      let iv: Uint8Array
      let ciphertext: Uint8Array
      try {
        iv = base64ToBytes(parsed.iv)
        ciphertext = base64ToBytes(parsed.data)
      } catch {
        return jsonError(400, 'Invalid base64 in iv/data')
      }
      if (iv.byteLength !== 16) return jsonError(400, 'Invalid IV length')

      const keyBytes = await readKey(env.KEY_BASE64)
      if (!keyBytes) return jsonError(401, 'KEY is not set')
      if (keyBytes.byteLength !== 32) return jsonError(401, 'KEY must be 32 bytes')

      const key = await crypto.subtle.importKey(
        'raw',
        keyBytes as unknown as BufferSource,
        { name: 'AES-CBC' },
        false,
        ['decrypt']
      )

      let plaintextBytes: ArrayBuffer
      try {
        plaintextBytes = await crypto.subtle.decrypt(
          { name: 'AES-CBC', iv: iv as unknown as BufferSource },
          key,
          ciphertext as unknown as BufferSource
        )
      } catch {
        return jsonError(400, 'Decryption failed')
      }

      const urlStr = textDecoder.decode(new Uint8Array(plaintextBytes)).trim()
      let target: URL
      try {
        target = new URL(urlStr)
      } catch {
        return jsonError(400, 'Invalid URL')
      }
      if (target.protocol !== 'http:' && target.protocol !== 'https:')
        return jsonError(403, 'Scheme not allowed')

      const timeoutMs = parseInt(String(env.TIMEOUT_SECS ?? '60'), 10) * 1000
      const signal: AbortSignal =
        (AbortSignal as any).timeout && typeof (AbortSignal as any).timeout === 'function'
          ? (AbortSignal as any).timeout(timeoutMs)
          : (() => {
              const ctrl = new AbortController()
              setTimeout(() => ctrl.abort(), timeoutMs)
              return ctrl.signal
            })()

      const originResp = await fetch(target.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal,
      })

      // Optional size limit
      const maxMegaBytesRaw = env.MAX_MEGABYTES
      const maxBytes =
        maxMegaBytesRaw != null ? parseInt(String(maxMegaBytesRaw), 10) * 1024 * 1024 : undefined
      const headers = new Headers(originResp.headers)

      if (typeof maxBytes === 'number' && Number.isFinite(maxBytes) && maxBytes > 0) {
        const cl = headers.get('content-length')
        if (cl && Number.isFinite(Number(cl)) && Number(cl) > maxBytes) {
          return jsonError(413, 'Response too large')
        }
        // If we wrap/limit the stream, drop content-length since we may cut early
        headers.delete('content-length')
        const limited = originResp.body ? limitStream(originResp.body, maxBytes) : null
        return new Response(limited, { status: originResp.status, headers })
      }

      // Transparent pass-through of origin response
      return new Response(originResp.body, { status: originResp.status, headers })
    } catch (err) {
      return jsonError(500, 'Internal error')
    }
  },
}

async function extractQ(request: Request): Promise<string | null> {
  const url = new URL(request.url)
  return url.searchParams.get('q')
}

function base64ToBytes(b64: string): Uint8Array {
  try {
    const norm = normalizeB64(b64)
    const bin = atob(norm)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  } catch {
    throw new Error('Invalid base64')
  }
}

function base64ToString(b64: string): string {
  const bytes = base64ToBytes(b64)
  return new TextDecoder().decode(bytes)
}

async function readKey(raw?: string): Promise<Uint8Array | null> {
  if (!raw) return null
  if (raw.startsWith('base64:')) return base64ToBytes(raw.slice(7))
  if (raw.startsWith('hex:')) return hexToBytes(raw.slice(4))
  // treat as UTF-8 string
  return new TextEncoder().encode(raw)
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim()
  if (clean.length % 2 !== 0) throw new Error('Invalid hex')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16)
  }
  return out
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function normalizeB64(b64: string): string {
  // Support URL-safe base64 and missing padding
  let s = b64.replace(/-/g, '+').replace(/_/g, '/').trim()
  const pad = s.length % 4
  if (pad === 2) s += '=='
  else if (pad === 3) s += '='
  else if (pad !== 0) s += '=== '.slice(0, (4 - pad) % 4) // defensive, should not hit
  return s
}

function limitStream(body: ReadableStream<Uint8Array>, limit: number): ReadableStream<Uint8Array> {
  const reader = body.getReader()
  let count = 0
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await reader.read()
      if (done) {
        controller.close()
        return
      }
      count += value.byteLength
      if (count <= limit) {
        controller.enqueue(value)
        return
      }
      // Exceeded: enqueue only remaining allowed bytes then close
      const over = count - limit
      const allowed = value.subarray(0, value.byteLength - over)
      if (allowed.byteLength > 0) controller.enqueue(allowed)
      controller.close()
      await reader.cancel()
    },
    async cancel(reason) {
      await reader.cancel(reason)
    },
  })
}
