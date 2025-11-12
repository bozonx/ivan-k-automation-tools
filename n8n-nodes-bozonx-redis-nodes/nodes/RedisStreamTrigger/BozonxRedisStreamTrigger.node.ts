import {
	type ITriggerFunctions,
	type INodeType,
	type INodeTypeDescription,
	NodeOperationError,
	type ITriggerResponse,
	type IDataObject,
} from 'n8n-workflow';
import { getRedisClientConnected } from '../RedisStreamProducer/redisClient';

declare function setTimeout(
    handler: (...args: unknown[]) => void,
    timeout?: number,
    ...args: unknown[]
): unknown;

export class BozonxRedisStreamTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Redis Sub Trigger',
		name: 'bozonxRedisStreamTrigger',
		group: ['trigger'],
		version: 1,
		description: 'Emit items when new entries appear in a Redis Stream (XREAD)',
		defaults: { name: 'Redis Sub Trigger' },
		icon: 'file:redis-stream-trigger.svg',
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'bozonxRedis',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event Name',
				name: 'streamKey',
				type: 'string',
				default: 'my-service:main',
				required: true,
				description: 'Redis Stream key to read entries from, e.g. "my-service:main"',
			},
			{
				displayName: 'Allowed Stale (Seconds)',
				name: 'staleSeconds',
				type: 'number',
				default: 0,
				description:
					'On start, also emit entries up to this many seconds old (if > 0). 0 emits only new entries after the node starts.',
			},
		],
		usableAsTool: true,
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const creds = await this.getCredentials('bozonxRedis');
		const host = (creds?.host as string) || 'localhost';
		const port = (creds?.port as number) ?? 6379;
		const username = (creds?.username as string) || '';
		const password = (creds?.password as string) || '';
		const tls = (creds?.tls as boolean) || false;
		const db = (creds?.db as number) ?? 0;

		const client = await getRedisClientConnected({ host, port, username, password, tls, db });

		const streamKey = (this.getNodeParameter('streamKey', 0) as string).trim();
		const blockMs = 10000;
		const count = 50;
		const persistLastId = true;

		if (!streamKey) {
			throw new NodeOperationError(this.getNode(), 'Event name is required');
		}

		const staticData = this.getWorkflowStaticData('node') as { lastId?: string } & IDataObject;

		const staleSeconds = (this.getNodeParameter('staleSeconds', 0) as number) ?? 0;
		let lastId: string;
		if (typeof staticData.lastId === 'string' && staticData.lastId) {
			lastId = staticData.lastId;
		} else if (!staleSeconds || staleSeconds <= 0) {
			lastId = '$'; // only new messages from now
		} else {
			const startMs = Date.now() - Math.floor(staleSeconds * 1000);
			lastId = `${startMs}-0`;
		}

		type RedisClientLike = { sendCommand(args: string[]): Promise<unknown> };
		const c = client as unknown as RedisClientLike;

		let running = true;

		const readLoop = async () => {
			while (running) {
				try {
					const cmd: string[] = ['XREAD'];
					if (count && count > 0) cmd.push('COUNT', String(count));
					if (blockMs && blockMs > 0) cmd.push('BLOCK', String(blockMs));
					cmd.push('STREAMS', streamKey, lastId);

					const res = await c.sendCommand(cmd);
					// res example: [[streamKey, [[id, [field, value, field, value, ...]], ...]]]
					if (!res || !Array.isArray(res) || res.length === 0) {
						continue; // timeout/no data
					}

					const entriesWrap = res[0];
					const entries = Array.isArray(entriesWrap) ? entriesWrap[1] : undefined;
					if (!Array.isArray(entries) || entries.length === 0) continue;

					const outItems: Array<{ json: IDataObject }> = [];

					for (const entry of entries) {
						const id: string = entry[0];
						const kv: string[] = entry[1] as string[];
						lastId = id;

						if (persistLastId) staticData.lastId = lastId;

						const fields: Record<string, string> = {};
						for (let i = 0; i < kv.length; i += 2) {
							const k = String(kv[i]);
							const v = String(kv[i + 1] ?? '');
							// Skip internal marker field
							if (k === '__empty') continue;
							fields[k] = v;
						}

						let payload: unknown = null;
						if (Object.keys(fields).length === 1) {
							if (fields['data'] !== undefined) {
								try {
									const parsed = JSON.parse(fields['data'] as string);
									payload =
										typeof parsed === 'object' && parsed !== null
											? (parsed as IDataObject)
											: ({ value: parsed } as IDataObject);
								} catch {
									payload = { data: fields['data'] } as IDataObject;
								}
							} else if (fields['payload'] !== undefined) {
								payload = fields['payload'];
							} else {
								const typed: Record<string, unknown> = {};
								for (const [k, sv] of Object.entries(fields)) {
									const t = sv.trim();
									let val: unknown = sv;
									if (t === 'true') val = true;
									else if (t === 'false') val = false;
									else if (t === 'null') val = null;
									else if (
										(t.startsWith('{') && t.endsWith('}')) ||
										(t.startsWith('[') && t.endsWith(']'))
									) {
										try {
											val = JSON.parse(t);
										} catch { void 0; }
									} else {
										const n = Number(t);
										if (t !== '' && Number.isFinite(n)) val = n;
									}
									typed[k] = val;
								}
								payload = typed as IDataObject;
							}
						} else if (Object.keys(fields).length > 0) {
							const typed: Record<string, unknown> = {};
							for (const [k, sv] of Object.entries(fields)) {
								const t = sv.trim();
								let val: unknown = sv;
								if (t === 'true') val = true;
								else if (t === 'false') val = false;
								else if (t === 'null') val = null;
								else if (
									(t.startsWith('{') && t.endsWith('}')) ||
									(t.startsWith('[') && t.endsWith(']'))
								) {
									try {
										val = JSON.parse(t);
									} catch { void 0; }
								} else {
									const n = Number(t);
									if (t !== '' && Number.isFinite(n)) val = n;
								}
								typed[k] = val;
							}
							payload = typed as IDataObject;
						} else {
							payload = null;
						}

						const json: IDataObject = { payload, _stream: streamKey, _id: id } as IDataObject;

						outItems.push({ json });
					}

					if (outItems.length > 0) {
						// Emit to workflow
						this.emit([outItems]);
					}
				} catch {
					// Temporary error while reading; wait briefly and retry
					await new Promise((r) => setTimeout(r as () => void, 1000));
					continue;
				}
			}
		};

		// Start loop without awaiting it
		void readLoop();

		return {
			closeFunction: async () => {
				running = false;
			},
			manualTriggerFunction: async () => {
				// Manual read with up to blockMs wait and emit results
				try {
					const cmd: string[] = ['XREAD'];
					if (count && count > 0) cmd.push('COUNT', String(count));
					if (blockMs && blockMs > 0) cmd.push('BLOCK', String(blockMs));
					cmd.push('STREAMS', streamKey, lastId);

					const res = await c.sendCommand(cmd);
					if (!res || !Array.isArray(res) || res.length === 0) return;

					const entriesWrap = res[0];
					const entries = Array.isArray(entriesWrap) ? entriesWrap[1] : undefined;
					if (!Array.isArray(entries) || entries.length === 0) return;

					const outItems: Array<{ json: IDataObject }> = [];
					for (const entry of entries) {
						const id: string = entry[0];
						const kv: string[] = entry[1] as string[];
						lastId = id;
						if (persistLastId) staticData.lastId = lastId;

						const fields: Record<string, string> = {};
						for (let i = 0; i < kv.length; i += 2) {
							const k = String(kv[i]);
							const v = String(kv[i + 1] ?? '');
							// Skip internal marker field
							if (k === '__empty') continue;
							fields[k] = v;
						}

						let payload: unknown = null;
						if (Object.keys(fields).length === 1) {
							if (fields['data'] !== undefined) {
								try {
									const parsed = JSON.parse(fields['data'] as string);
									payload =
										typeof parsed === 'object' && parsed !== null
											? (parsed as IDataObject)
											: ({ value: parsed } as IDataObject);
								} catch {
									payload = { data: fields['data'] } as IDataObject;
								}
							} else if (fields['payload'] !== undefined) {
								payload = fields['payload'];
							} else {
								payload = { ...fields } as IDataObject;
							}
						} else if (Object.keys(fields).length > 0) {
							payload = { ...fields } as IDataObject;
						} else {
							payload = null;
						}

						const json: IDataObject = { payload, _stream: streamKey, _id: id } as IDataObject;

						outItems.push({ json });
					}

					if (outItems.length > 0) this.emit([outItems]);
				} catch {
					// ignore
				}
			},
		};
	}
}
