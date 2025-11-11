import { createClient } from 'redis';

export interface RedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: boolean;
  db?: number;
}

// Use loose typing to avoid generics incompatibilities across redis versions
const clients = new Map<string, any>();

function buildUrl(opts: RedisConnectionOptions): string {
  const proto = opts.tls ? 'rediss' : 'redis';
  const authPart = opts.username
    ? `${encodeURIComponent(opts.username)}:${encodeURIComponent(opts.password ?? '')}@`
    : (opts.password ? `:${encodeURIComponent(opts.password)}@` : '');
  const dbPath = typeof opts.db === 'number' ? `/${opts.db}` : '';
  return `${proto}://${authPart}${opts.host}:${opts.port}${dbPath}`;
}

export async function getRedisClientConnected(opts: RedisConnectionOptions): Promise<any> {
  const url = buildUrl(opts);
  const cached = clients.get(url);
  if (cached) {
    if ((cached as any).isOpen) return cached;
    try { await cached.connect(); return cached; } catch { /* fallthrough */ }
  }
  const client = createClient({ url });
  client.on('error', () => {/* suppress unhandled error handler */});
  await client.connect();
  clients.set(url, client);
  return client;
}
