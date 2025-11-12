export interface RedisConnectionOptions {
	host: string;
	port: number;
	username?: string;
	password?: string;
	tls?: boolean;
	db?: number;
}

// Cache clients by URL
const clients = new Map<string, unknown>();

function buildUrl(opts: RedisConnectionOptions): string {
	const proto = opts.tls ? 'rediss' : 'redis';
	const authPart = opts.username
		? `${encodeURIComponent(opts.username)}:${encodeURIComponent(opts.password ?? '')}@`
		: opts.password
			? `:${encodeURIComponent(opts.password)}@`
			: '';
	const dbPath = typeof opts.db === 'number' ? `/${opts.db}` : '';
	return `${proto}://${authPart}${opts.host}:${opts.port}${dbPath}`;
}

type RedisClientLike = {
	isOpen?: boolean;
	connect(): Promise<void>;
};

export async function getRedisClientConnected(opts: RedisConnectionOptions): Promise<unknown> {
	const url = buildUrl(opts);
	const cached = clients.get(url) as RedisClientLike | undefined;
	if (cached) {
		if (cached.isOpen) return cached as unknown;
		try {
			await cached.connect();
			return cached as unknown;
		} catch {
			/* fallthrough */
		}
	}
	const { createClient } = await import('redis');
	const client = createClient({ url });
	client.on('error', () => {
		/* suppress unhandled error handler */
	});
	await client.connect();
	clients.set(url, client as unknown);
	return client as unknown;
}
