import {
  NodeOperationError,
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  type ICredentialTestFunctions,
  type INodeCredentialTestResult,
  type ICredentialsDecrypted,
} from 'n8n-workflow';

import { createRedisClientConnected, ttlToSeconds, type RedisConnectionOptions } from './redisClient';

interface FieldPair {
  key?: string;
  valueBoolean?: boolean;
  valueNumber?: number;
  valueString?: string;
  valueJson?: string;
  valueType?: 'string' | 'number' | 'boolean' | 'null' | 'json';
}

export class BozonxRedisCache implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Redis Cache',
    name: 'bozonxRedisCache',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["mode"] + ": " + $parameter["key"]}}',
    description: 'Read and write JSON values in Redis',
    defaults: { name: 'Redis Cache' },
    icon: 'file:redis-cache.svg',
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
        description: 'Select the operation mode',
      },
      {
        displayName: 'Key',
        name: 'key',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'cache:my-key',
        description: 'Redis key to store or read the value',
      },
      {
        displayName: 'Payload Type',
        name: 'payloadType',
        type: 'options',
        options: [
          { name: 'JSON', value: 'json' },
          { name: 'Custom Fields', value: 'fields' },
        ],
        default: 'json',
        description: 'Select the payload source',
        displayOptions: { show: { mode: ['write'] } },
      },
      {
        displayName: 'Data (JSON)',
        name: 'data',
        type: 'string',
        typeOptions: { rows: 5 },
        default: '',
        required: true,
        placeholder: '{ "foo": "bar" }',
        description: 'JSON string to store as the Redis value',
        displayOptions: { show: { mode: ['write'], payloadType: ['json'] } },
      },
      {
        displayName: 'Fields',
        name: 'fields',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        placeholder: 'Add Field',
        description: 'Key-value pairs to build a JSON object',
        displayOptions: { show: { mode: ['write'], payloadType: ['fields'] } },
        options: [
          {
            name: 'field',
            displayName: 'Field',
            values: [
              {
                displayName: 'Boolean Value',
                name: 'valueBoolean',
                type: 'boolean',
                default: false,
                displayOptions: { show: { valueType: ['boolean'] } },
              },
              {
                displayName: 'JSON Value',
                name: 'valueJson',
                type: 'string',
                default: '',
                placeholder: '{ "nested": true }',
                description: 'Provide a valid JSON to be parsed as the field value',
                displayOptions: { show: { valueType: ['json'] } },
              },
              {
                displayName: 'Key',
                name: 'key',
                type: 'string',
                default: '',
                required: true,
              },
              {
                displayName: 'Number Value',
                name: 'valueNumber',
                type: 'number',
                default: 0,
                displayOptions: { show: { valueType: ['number'] } },
              },
              {
                displayName: 'String Value',
                name: 'valueString',
                type: 'string',
                default: '',
                displayOptions: { show: { valueType: ['string'] } },
              },
              {
                displayName: 'Value Type',
                name: 'valueType',
                type: 'options',
                options: [
                  { name: 'Boolean', value: 'boolean' },
                  { name: 'JSON', value: 'json' },
                  { name: 'Null', value: 'null' },
                  { name: 'Number', value: 'number' },
                  { name: 'String', value: 'string' },
                ],
                default: 'string',
                description: 'Type of the value to serialize into JSON',
              },
            ],
          },
        ],
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
        default: 'hours',
        description: 'Unit for the TTL value',
        displayOptions: { show: { mode: ['write'] } },
      },
      {
        displayName: 'TTL Value',
        name: 'ttl',
        type: 'number',
        typeOptions: { minValue: 0 },
        default: 1,
        placeholder: '0',
        description: 'Time-to-live value. Set 0 for no expiration.',
        displayOptions: { show: { mode: ['write'] } },
      },
    ],
		usableAsTool: true,
  };

  methods = {
    credentialTest: {
      async bozonxRedis(
        this: ICredentialTestFunctions,
        credential: ICredentialsDecrypted,
      ): Promise<INodeCredentialTestResult> {
        try {
          const creds = credential.data as IDataObject;
          const options: RedisConnectionOptions = {
            host: (creds.host as string) || 'localhost',
            port: (creds.port as number) ?? 6379,
            username: (creds.username as string) || undefined,
            password: (creds.password as string) || undefined,
            tls: Boolean(creds.tls),
            db: (creds.db as number) ?? 0,
          };

          const client = await createRedisClientConnected(options);
          await client.quit();
          return { status: 'OK', message: 'Connection successful' };
        } catch (error) {
          return { status: 'Error', message: (error as Error).message };
        }
      },
    },
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
            const payloadType = this.getNodeParameter('payloadType', i, 'json') as 'json' | 'fields';

            let normalized: string;
            if (payloadType === 'json') {
              const dataStr = this.getNodeParameter('data', i) as string;
              if (!dataStr) {
                throw new NodeOperationError(this.getNode(), 'Data (JSON) is required', { itemIndex: i });
              }

              try {
                const parsed = JSON.parse(dataStr);
                normalized = JSON.stringify(parsed);
              } catch {
                throw new NodeOperationError(this.getNode(), 'Invalid JSON provided in Data', { itemIndex: i });
              }
            } else {
              const fields = (this.getNodeParameter('fields', i, {}) as IDataObject) || {};
              const pairs = ((fields as { field?: FieldPair[] }).field) ?? [];
              const obj: Record<string, unknown> = {};
              for (const pair of pairs) {
                const k = String(pair.key ?? '').trim();
                if (!k) {
                  throw new NodeOperationError(this.getNode(), 'Field key must not be empty', { itemIndex: i });
                }

                const type = (pair.valueType ?? 'string') as NonNullable<FieldPair['valueType']>;
                let value: unknown;
                switch (type) {
                  case 'number': {
                    const raw = pair.valueNumber;
                    const n = Number(raw);
                    if (!Number.isFinite(n)) {
                      throw new NodeOperationError(this.getNode(), `Invalid number for field "${k}"`, { itemIndex: i });
                    }
                    value = n;
                    break;
                  }
                  case 'boolean': {
                    value = Boolean(pair.valueBoolean);
                    break;
                  }
                  case 'null': {
                    value = null;
                    break;
                  }
                  case 'json': {
                    const raw = pair.valueJson as string;
                    try {
                      value = raw ? JSON.parse(raw) : null;
                    } catch {
                      throw new NodeOperationError(this.getNode(), `Invalid JSON for field "${k}"`, { itemIndex: i });
                    }
                    break;
                  }
                  case 'string':
                  default: {
                    value = pair.valueString ?? '';
                    break;
                  }
                }
              obj[k] = value;
            }
            normalized = JSON.stringify(obj);
            }
            const ttl = this.getNodeParameter('ttl', i, 0) as number;
            if (ttl < 0) {
              throw new NodeOperationError(this.getNode(), 'TTL must be >= 0', { itemIndex: i });
            }
            const ttlUnit = (this.getNodeParameter('ttlUnit', i, 'hours') as 'seconds' | 'minutes' | 'hours' | 'days');
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
          // Fallback in case quit fails
          client.destroy?.();
        }
      }
    }

    return [returnData];
  }
}
