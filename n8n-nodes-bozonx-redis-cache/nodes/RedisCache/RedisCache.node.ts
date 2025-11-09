import {
  NodeOperationError,
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
} from 'n8n-workflow';

import { createRedisClientConnected, ttlToSeconds, type RedisConnectionOptions } from './redisClient';

export class RedisCache implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Redis Cache',
    name: 'bozonxRedisCache',
    group: ['transform'],
    version: 1,
    description: 'Read and write JSON values in Redis',
    defaults: { name: 'Redis Cache' },
    inputs: ['main'],
    outputs: ['main'],
    documentationUrl:
      'https://github.com/bozonx/ivan-k-automation-tools/tree/main/n8n-nodes-bozonx-redis-cache#readme',
    credentials: [
      {
        name: 'bozonxRedis',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'options',
        options: [
          { name: 'Write', value: 'write' },
          { name: 'Read', value: 'read' },
        ],
        default: 'write',
      },
      {
        displayName: 'Key',
        name: 'key',
        type: 'string',
        default: '',
        required: true,
        description: 'Key under which the value is stored in Redis',
      },
      {
        displayName: 'Data (JSON)',
        name: 'data',
        type: 'string',
        typeOptions: { rows: 5 },
        default: '',
        required: true,
        description: 'JSON string to write as value',
        displayOptions: { show: { mode: ['write'] } },
      },
      {
        displayName: 'TTL Value',
        name: 'ttl',
        type: 'number',
        default: 0,
        description: 'Time-to-live value. 0 means no expiration',
        displayOptions: { show: { mode: ['write'] } },
      },
      {
        displayName: 'TTL Unit',
        name: 'ttlUnit',
        type: 'options',
        options: [
          { name: 'Seconds', value: 'seconds' },
          { name: 'Minutes', value: 'minutes' },
          { name: 'Hours', value: 'hours' },
          { name: 'Days', value: 'days' },
        ],
        default: 'seconds',
        displayOptions: { show: { mode: ['write'] } },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Collect credentials once and connect a single client for all items
    const creds = await this.getCredentials('bozonxRedis');

    const options: RedisConnectionOptions = {
      host: (creds?.host as string) || 'localhost',
      port: (creds?.port as number) ?? 6379,
      username: (creds?.username as string) || undefined,
      password: (creds?.password as string) || undefined,
      tls: Boolean(creds?.tls),
      db: (creds?.db as number) ?? 0,
    };

    let client: Awaited<ReturnType<typeof createRedisClientConnected>> | undefined;

    try {
      client = await createRedisClientConnected(options);

      for (let i = 0; i < items.length; i++) {
        try {
          const mode = this.getNodeParameter('mode', i) as 'write' | 'read';
          const key = (this.getNodeParameter('key', i) as string).trim();

          if (!key) {
            throw new NodeOperationError(this.getNode(), 'Key must not be empty', { itemIndex: i });
          }

          if (mode === 'write') {
            const dataStr = this.getNodeParameter('data', i) as string;
            if (!dataStr) {
              throw new NodeOperationError(this.getNode(), 'Data (JSON) is required', { itemIndex: i });
            }

            // Validate JSON and normalize stringification
            let normalized: string;
            try {
              const parsed = JSON.parse(dataStr);
              normalized = JSON.stringify(parsed);
            } catch {
              throw new NodeOperationError(this.getNode(), 'Invalid JSON provided in Data', { itemIndex: i });
            }

            const ttl = (this.getNodeParameter('ttl', i, 0) as number) ?? 0;
            if (ttl < 0) {
              throw new NodeOperationError(this.getNode(), 'TTL must be >= 0', { itemIndex: i });
            }
            const ttlUnit = (this.getNodeParameter('ttlUnit', i, 'seconds') as 'seconds' | 'minutes' | 'hours' | 'days');
            const ttlSeconds = ttlToSeconds(ttl, ttlUnit);

            if (ttlSeconds > 0) {
              await client.set(key, normalized, { EX: ttlSeconds });
            } else {
              await client.set(key, normalized);
            }

            returnData.push({
              json: { ok: true, key, ttlSeconds } as IDataObject,
              pairedItem: { item: i },
            });
          } else {
            const value = await client.get(key);
            if (value === null) {
              returnData.push({ json: { found: false, key } as IDataObject, pairedItem: { item: i } });
              continue;
            }

            try {
              const parsed = JSON.parse(value);
              returnData.push({
                json: { found: true, key, value: parsed } as IDataObject,
                pairedItem: { item: i },
              });
            } catch {
              throw new NodeOperationError(this.getNode(), 'Stored value is not valid JSON', { itemIndex: i });
            }
          }
        } catch (error) {
          if (this.continueOnFail()) {
            returnData.push({ json: { error: (error as Error).message } as IDataObject, pairedItem: { item: i } });
            continue;
          }
          throw error;
        }
      }
    } finally {
      if (client) {
        try {
          await client.quit();
        } catch {
          try {
            // Fallback in case quit fails
            // @ts-ignore
            client.destroy?.();
          } catch {}
        }
      }
    }

    return [returnData];
  }
}
