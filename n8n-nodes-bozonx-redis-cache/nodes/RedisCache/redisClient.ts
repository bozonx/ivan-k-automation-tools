import { createClient } from 'redis';

export interface RedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: boolean;
  db?: number;
}

export function ttlToSeconds(ttl: number, unit: 'seconds' | 'minutes' | 'hours' | 'days'): number {
  if (!ttl || ttl <= 0) return 0;
  switch (unit) {
    case 'seconds':
      return ttl;
    case 'minutes':
      return ttl * 60;
    case 'hours':
      return ttl * 3600;
    case 'days':
      return ttl * 86400;
    default:
      return ttl;
  }
}

export async function createRedisClientConnected(options: RedisConnectionOptions): Promise<ReturnType<typeof createClient>> {
  const client = createClient({
    socket: {
      host: options.host,
      port: options.port,
      tls: options.tls ? true : undefined,
    },
    username: options.username || undefined,
    password: options.password || undefined,
    database: typeof options.db === 'number' ? options.db : undefined,
  });

  client.on('error', (err: unknown) => {
    // Log to console; n8n will convert thrown errors in node logic
    (globalThis as any)?.console?.error?.('Redis Client Error', err);
  });

  await client.connect();
  return client;
}
