export interface Env {
  KEY?: string;
  TIMEOUT_MS?: string | number;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const q = await extractQ(request);
      if (!q) return jsonError(400, "Missing 'q'");

      let containerStr: string;
      try {
        containerStr = base64ToString(q);
      } catch {
        return jsonError(400, 'Invalid base64 container');
      }
      let parsed: { iv: string; data: string };
      try {
        parsed = JSON.parse(containerStr);
      } catch {
        return jsonError(400, 'Invalid container JSON');
      }

      if (!parsed?.iv || !parsed?.data) return jsonError(400, 'Missing iv/data');

      let iv: Uint8Array;
      let ciphertext: Uint8Array;
      try {
        iv = base64ToBytes(parsed.iv);
        ciphertext = base64ToBytes(parsed.data);
      } catch {
        return jsonError(400, 'Invalid base64 in iv/data');
      }
      if (iv.byteLength !== 16) return jsonError(400, 'Invalid IV length');

      const keyBytes = await readKey(env.KEY);
      if (!keyBytes) return jsonError(401, 'KEY is not set');
      if (keyBytes.byteLength !== 32) return jsonError(401, 'KEY must be 32 bytes');

      const key = await crypto.subtle.importKey(
        'raw',
        keyBytes as unknown as BufferSource,
        { name: 'AES-CBC' },
        false,
        ['decrypt']
      );

      let plaintextBytes: ArrayBuffer;
      try {
        plaintextBytes = await crypto.subtle.decrypt(
          { name: 'AES-CBC', iv: iv as unknown as BufferSource },
          key,
          ciphertext as unknown as BufferSource
        );
      } catch {
        return jsonError(400, 'Decryption failed');
      }

      const urlStr = textDecoder.decode(new Uint8Array(plaintextBytes)).trim();
      let target: URL;
      try {
        target = new URL(urlStr);
      } catch {
        return jsonError(400, 'Invalid URL');
      }
      if (target.protocol !== 'http:' && target.protocol !== 'https:') return jsonError(403, 'Scheme not allowed');

      const timeoutMs = parseInt(String(env.TIMEOUT_MS ?? '15000'), 10);
      const signal: AbortSignal = (AbortSignal as any).timeout && typeof (AbortSignal as any).timeout === 'function'
        ? (AbortSignal as any).timeout(timeoutMs)
        : (() => {
            const ctrl = new AbortController();
            setTimeout(() => ctrl.abort(), timeoutMs);
            return ctrl.signal;
          })();

      const originResp = await fetch(target.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal,
      });

      // Transparent pass-through of origin response
      const headers = new Headers(originResp.headers);
      return new Response(originResp.body, { status: originResp.status, headers });
    } catch (err) {
      return jsonError(500, 'Internal error');
    }
  },
};

async function extractQ(request: Request): Promise<string | null> {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    return url.searchParams.get('q');
  }
  if (request.method === 'POST') {
    const ctype = request.headers.get('content-type') || '';
    const bodyText = await request.text();
    if (!bodyText) return null;
    if (ctype.includes('application/json')) {
      try {
        const j = JSON.parse(bodyText);
        if (j && typeof j.q === 'string') return j.q;
      } catch {
        // fallthrough to treat as raw text
      }
    }
    return bodyText;
  }
  return null;
}

function base64ToBytes(b64: string): Uint8Array {
  try {
    const norm = normalizeB64(b64);
    const bin = atob(norm);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    throw new Error('Invalid base64');
  }
}

function base64ToString(b64: string): string {
  const bytes = base64ToBytes(b64);
  return new TextDecoder().decode(bytes);
}

async function readKey(raw?: string): Promise<Uint8Array | null> {
  if (!raw) return null;
  if (raw.startsWith('base64:')) return base64ToBytes(raw.slice(7));
  if (raw.startsWith('hex:')) return hexToBytes(raw.slice(4));
  // treat as UTF-8 string
  return new TextEncoder().encode(raw);
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  if (clean.length % 2 !== 0) throw new Error('Invalid hex');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return out;
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function normalizeB64(b64: string): string {
  // Support URL-safe base64 and missing padding
  let s = b64.replace(/-/g, '+').replace(/_/g, '/').trim();
  const pad = s.length % 4;
  if (pad === 2) s += '==';
  else if (pad === 3) s += '=';
  else if (pad !== 0) s += '=== '.slice(0, (4 - pad) % 4); // defensive, should not hit
  return s;
}
