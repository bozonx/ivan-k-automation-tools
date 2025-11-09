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
  const { createClient } = await import('redis');
  const client: MinimalRedisClient = createClient({
    socket: {
      host: options.host,
      port: options.port,
      tls: options.tls ? true : undefined,
    },
    username: options.username || undefined,
    password: options.password || undefined,
    database: typeof options.db === 'number' ? options.db : undefined,
  }) as unknown as MinimalRedisClient;

  // Avoid restricted globals; rely on n8n error handling upstream
  // client.on('error', (err) => console.error('Redis Client Error', err));

  await client.connect();
  return client;
}
