import {
  NodeOperationError,
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
} from 'n8n-workflow';
import { getRedisClientConnected } from './redisClient';

export class RedisStreamProducer implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Redis Pub',
    name: 'bozonxRedisStreamProducer',
    group: ['output'],
    version: 1,
    description: 'Append events to a Redis Stream using XADD',
    defaults: { name: 'Redis Pub' },
    icon: 'file:redis-stream-producer.svg',
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'bozonxRedisStreams',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Event name',
        name: 'streamKey',
        type: 'string',
        default: 'my-service:main',
        required: true,
        description:
          'Event name (Redis Stream key) to append messages to, e.g. "my-service:main"',
      },
      {
        displayName: 'Payload Mode',
        name: 'payloadMode',
        type: 'options',
        options: [
          { name: 'JSON (Single Field)', value: 'json', description: 'Send a single field named "data" containing JSON.stringify of the input item' },
          { name: 'Key-Value (From UI)', value: 'kv', description: 'Send key-value pairs defined below (multiple pairs can be added). Input item JSON is not used.' },
        ],
        default: 'json',
        description: 'Select how to build message fields',
      },
      {
        displayName: 'Payload',
        name: 'jsonPayload',
        type: 'string',
        displayOptions: { show: { payloadMode: ['json'] } },
        typeOptions: { rows: 8 },
        default: '',
        description: 'JSON to send as the single "data" field. If empty, the incoming item JSON will be used.',
      },
      {
        displayName: 'Payload',
        name: 'payload',
        type: 'fixedCollection',
        displayOptions: { show: { payloadMode: ['kv'] } },
        typeOptions: { multipleValues: true },
        default: {},
        options: [
          {
            name: 'pair',
            displayName: 'Pair',
            values: [
              {
                displayName: 'Key',
                name: 'key',
                type: 'string',
                default: '',
                description: 'Field name',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
                description: 'Field value',
              },
              {
                displayName: 'Type',
                name: 'type',
                type: 'options',
                options: [
                  { name: 'String', value: 'string' },
                  { name: 'Number', value: 'number' },
                  { name: 'Boolean', value: 'boolean' },
                  { name: 'JSON', value: 'json' },
                  { name: 'Null', value: 'null' },
                ],
                default: 'string',
                description: 'Value type. Will be validated and serialized accordingly',
              },
            ],
          },
        ],
        description: 'Key-value pairs used when Payload Mode = Key-Value (from UI)',
      },
    ],
    usableAsTool: true,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const creds = await this.getCredentials('bozonxRedisStreams');
    const host = (creds?.host as string) || 'localhost';
    const port = (creds?.port as number) ?? 6379;
    const username = (creds?.username as string) || '';
    const password = (creds?.password as string) || '';
    const tls = (creds?.tls as boolean) || false;
    const db = (creds?.db as number) ?? 0;

    const client = await getRedisClientConnected({ host, port, username, password, tls, db });

    for (let i = 0; i < items.length; i++) {
      try {
        const streamKey = (this.getNodeParameter('streamKey', i) as string).trim();
        const messageIdParam = '*';
        const payloadMode = this.getNodeParameter('payloadMode', i) as string;
        const maxLen = 1000000;
        const ttlSec = 86400;

        if (!streamKey) {
          throw new NodeOperationError(this.getNode(), 'Event name is required', { itemIndex: i });
        }

        const fields: Array<[string, string]> = [];

        if (payloadMode === 'json') {
          const jsonText = (this.getNodeParameter('jsonPayload', i, '') as string).trim();
          let dataObj: unknown;
          if (jsonText) {
            try {
              dataObj = JSON.parse(jsonText);
            } catch {
              throw new NodeOperationError(this.getNode(), 'Invalid JSON in Payload', { itemIndex: i });
            }
          } else {
            dataObj = items[i].json as IDataObject;
          }
          fields.push(['data', JSON.stringify(dataObj)]);
        } else {
          const payload = this.getNodeParameter('payload', i, {}) as IDataObject;
          const pairs = ((payload.pair as IDataObject[]) || [])
            .map((p) => ({ key: String(p.key ?? ''), value: String(p.value ?? ''), type: String(p.type ?? 'string') }))
            .filter((p) => p.key.length > 0);
          if (pairs.length === 0) {
            throw new NodeOperationError(this.getNode(), 'At least one key-value pair is required in Payload', { itemIndex: i });
          }
          for (const p of pairs) {
            let v: string;
            switch (p.type) {
              case 'number': {
                const n = Number(p.value);
                if (!Number.isFinite(n)) {
                  throw new NodeOperationError(this.getNode(), `Invalid number for key "${p.key}"`, { itemIndex: i });
                }
                v = String(n);
                break;
              }
              case 'boolean': {
                const t = String(p.value).trim().toLowerCase();
                if (t === 'true' || t === '1') v = 'true';
                else if (t === 'false' || t === '0') v = 'false';
                else {
                  throw new NodeOperationError(this.getNode(), `Invalid boolean for key "${p.key}" (expected true/false)`, { itemIndex: i });
                }
                break;
              }
              case 'json': {
                try {
                  const parsed = JSON.parse(p.value);
                  v = JSON.stringify(parsed);
                } catch {
                  throw new NodeOperationError(this.getNode(), `Invalid JSON for key "${p.key}"`, { itemIndex: i });
                }
                break;
              }
              case 'null': {
                v = 'null';
                break;
              }
              case 'string':
              default:
                v = p.value;
            }
            fields.push([p.key, v]);
          }
        }

        const cmd: string[] = ['XADD', streamKey];
        if (maxLen && maxLen > 0) {
          cmd.push('MAXLEN', '~', String(maxLen));
        }
        cmd.push(messageIdParam || '*');
        for (const [k, v] of fields) {
          cmd.push(k, v);
        }

        type RedisClientLike = { sendCommand(args: string[]): Promise<string> };
        const c = client as unknown as RedisClientLike;
        const id = await c.sendCommand(cmd);

        if (ttlSec && ttlSec > 0) {
          await c.sendCommand(['EXPIRE', streamKey, String(ttlSec)]);
        }

        returnData.push({ json: { stream: streamKey, id, fields: Object.fromEntries(fields) }, pairedItem: { item: i } });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: (error as Error).message } as IDataObject, pairedItem: { item: i } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
