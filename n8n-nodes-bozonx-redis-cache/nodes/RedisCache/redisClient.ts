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

type MinimalRedisClient = {
  connect(): Promise<void>;
  quit(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  destroy?: () => void;
};

export async function createRedisClientConnected(options: RedisConnectionOptions): Promise<MinimalRedisClient> {
  const scheme = options.tls ? 'rediss' : 'redis';
  const authPart = options.username
    ? `${encodeURIComponent(options.username)}:${encodeURIComponent(options.password ?? '')}@`
    : options.password
      ? `:${encodeURIComponent(options.password)}@`
      : '';
  const dbPart = typeof options.db === 'number' ? `/${options.db}` : '';
  const url = `${scheme}://${authPart}${options.host}:${options.port}${dbPart}`;

  const clientImpl = createClient({ url });
  await clientImpl.connect();

  const client: MinimalRedisClient = {
    async connect() {},
    async quit() {
      await clientImpl.quit();
    },
    async get(key: string) {
      const value = await clientImpl.get(key);
      return value ?? null;
    },
    async set(key: string, value: string, options?: { EX?: number }) {
      if (options?.EX && options.EX > 0) {
        await clientImpl.set(key, value, { EX: options.EX });
      } else {
        await clientImpl.set(key, value);
      }
    },
    destroy() {
      try {
        clientImpl.disconnect();
      } catch {}
    },
  };

  return client;
}
