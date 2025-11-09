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

export async function createRedisClientConnected(_options: RedisConnectionOptions): Promise<MinimalRedisClient> {
  // Touch the options to avoid unused variable lint, while keeping behavior
  void _options;
  const store = new Map<string, { value: string; exp?: number }>();

  const now = () => Date.now();
  const client: MinimalRedisClient = {
    async connect() {
      // no-op for in-memory
    },
    async quit() {
      // no-op for in-memory
    },
    async get(key: string) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.exp && entry.exp <= now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key: string, value: string, options?: { EX?: number }) {
      const exp = options?.EX ? now() + options.EX * 1000 : undefined;
      store.set(key, { value, exp });
    },
    destroy() {
      store.clear();
    },
  };

  await client.connect();
  return client;
}
