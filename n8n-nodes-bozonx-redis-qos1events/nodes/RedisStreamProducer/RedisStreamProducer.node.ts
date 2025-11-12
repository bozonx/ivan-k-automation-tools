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
    description: 'Append entries to a Redis Stream using XADD',
    defaults: { name: 'Redis Pub' },
    icon: 'file:redis-stream-producer.svg',
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'bozonxRedis',
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
          'Redis Stream key (event name) to append entries to, e.g. "my-service:main"',
      },
      {
        displayName: 'Payload Mode',
        name: 'payloadMode',
        type: 'options',
        options: [
          { name: 'Text', value: 'text', description: 'Send a single field named "payload" with the provided text' },
          { name: 'JSON', value: 'json', description: 'Send a single field named "data" with the JSON string of the provided JSON or the incoming item (if left empty)' },
          { name: 'Key-Value', value: 'kv', description: 'Send the key-value pairs configured below. The incoming item is ignored.' },
        ],
        default: 'text',
        description: 'Choose how the stream entry fields are constructed',
      },
      {
        displayName: 'Payload',
        name: 'stringPayload',
        type: 'string',
        displayOptions: { show: { payloadMode: ['text', 'json'] } },
        typeOptions: { rows: 8 },
        default: '',
        description: 'Content used by Text and JSON modes. For Text, sent as-is in field "payload". For JSON, provide valid JSON or leave empty to use the incoming item as JSON.',
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
                description: 'Value type. It will be validated and serialized accordingly.',
              },
              {
                displayName: 'Value',
                name: 'valueString',
                type: 'string',
                default: '',
                description: 'Field value',
                displayOptions: { show: { type: ['string'] } },
              },
              {
                displayName: 'Value',
                name: 'valueNumber',
                type: 'number',
                default: 0,
                description: 'Field value',
                displayOptions: { show: { type: ['number'] } },
              },
              {
                displayName: 'Value',
                name: 'valueBoolean',
                type: 'boolean',
                default: false,
                description: 'Field value',
                displayOptions: { show: { type: ['boolean'] } },
              },
              {
                displayName: 'Value',
                name: 'valueJson',
                type: 'string',
                typeOptions: { rows: 8 },
                default: '',
                description: 'Field value as JSON (stringified)',
                displayOptions: { show: { type: ['json'] } },
              },
            ],
          },
        ],
        description: 'Key-value pairs used when Payload Mode is Key-Value',
      },
    ],
    usableAsTool: true,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const creds = await this.getCredentials('bozonxRedis');
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
        let resultPayloadKV: IDataObject | null = null;

        if (payloadMode === 'text') {
          const text = (this.getNodeParameter('stringPayload', i, '') as string).trim();
          fields.push(['payload', text]);
        } else if (payloadMode === 'json') {
          const raw = (this.getNodeParameter('stringPayload', i, '') as string).trim();
          let dataObj: unknown;
          if (raw) {
            try {
              dataObj = JSON.parse(raw);
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
            .map((p) => ({
              key: String(p.key ?? ''),
              type: String(p.type ?? 'string'),
              valueString: (p as any).valueString as string | undefined,
              valueNumber: (p as any).valueNumber as number | undefined,
              valueBoolean: (p as any).valueBoolean as boolean | undefined,
              valueJson: (p as any).valueJson as string | undefined,
            }))
            .filter((p) => p.key.length > 0);
          const resultObj: IDataObject = {};
          for (const p of pairs) {
            let v: string;
            let typed: unknown;
            switch (p.type) {
              case 'number': {
                const n = Number(p.valueNumber);
                if (!Number.isFinite(n)) {
                  throw new NodeOperationError(this.getNode(), `Invalid number for key "${p.key}"`, { itemIndex: i });
                }
                v = String(n);
                typed = n;
                break;
              }
              case 'boolean': {
                const b = Boolean(p.valueBoolean);
                v = b ? 'true' : 'false';
                typed = b;
                break;
              }
              case 'json': {
                try {
                  const parsed = JSON.parse(p.valueJson ?? '');
                  v = JSON.stringify(parsed);
                  typed = parsed as unknown;
                } catch {
                  throw new NodeOperationError(this.getNode(), `Invalid JSON for key "${p.key}"`, { itemIndex: i });
                }
                break;
              }
              case 'null': {
                v = 'null';
                typed = null;
                break;
              }
              case 'string':
              default:
                v = String(p.valueString ?? '');
                typed = p.valueString ?? '';
            }
            fields.push([p.key, v]);
            resultObj[p.key] = typed as any;
          }
          // If no fields, add a marker field so XADD succeeds
          if (pairs.length === 0) {
            fields.push(['__empty', 'true']);
          }
          resultPayloadKV = Object.keys(resultObj).length > 0 ? resultObj : null;
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

        const fieldsObj = Object.fromEntries(fields) as Record<string, string>;
        let payload: unknown = null;
        if (payloadMode === 'kv') {
          payload = resultPayloadKV;
        } else {
          if (Object.keys(fieldsObj).length === 1) {
            if ((fieldsObj as any).data !== undefined) {
              try {
                const parsed = JSON.parse((fieldsObj as any).data as unknown as string);
                payload = (typeof parsed === 'object' && parsed !== null)
                  ? (parsed as IDataObject)
                  : ({ value: parsed } as IDataObject);
              } catch {
                payload = { data: (fieldsObj as any).data } as IDataObject;
              }
            } else if ((fieldsObj as any).payload !== undefined) {
              payload = (fieldsObj as any).payload as unknown as string;
            }
          } else if (Object.keys(fieldsObj).length > 0) {
            payload = { ...fieldsObj } as IDataObject;
          } else {
            payload = null;
          }
        }
        const json: IDataObject = { payload, _stream: streamKey, _id: id } as IDataObject;
        returnData.push({ json, pairedItem: { item: i } });
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
