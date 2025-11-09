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
    displayName: 'Redis Stream Producer',
    name: 'bozonxRedisStreamProducer',
    group: ['output'],
    version: 1,
    description: 'Append events to a Redis Stream using XADD',
    defaults: { name: 'Redis Stream Producer' },
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
        displayName: 'Stream Key',
        name: 'streamKey',
        type: 'string',
        default: 'events:default',
        required: true,
        description:
          'Redis Stream key to append messages to, e.g. "events:stt"',
      },
      {
        displayName: 'Message ID',
        name: 'messageId',
        type: 'string',
        default: '*',
        description:
          'Message ID to use for XADD. Use * to let Redis assign an auto-generated ID.',
      },
      {
        displayName: 'Payload Mode',
        name: 'payloadMode',
        type: 'options',
        options: [
          { name: 'JSON (single field)', value: 'json', description: 'Send a single field named "data" containing JSON.stringify of the input item' },
          { name: 'Key-Value (from UI)', value: 'kv', description: 'Send key-value pairs defined below (multiple pairs can be added). Input item JSON is not used.' },
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
                description: 'Field value (stored as string)',
              },
            ],
          },
        ],
        description: 'Key-value pairs used when Payload Mode = Key-Value (from UI)'
      },
      {
        displayName: 'Max Stream Length',
        name: 'maxLen',
        type: 'number',
        default: 0,
        description:
          'If set (> 0), uses XADD MAXLEN ~ <N> to approximately trim the stream to about N newest entries. Leave 0 to disable trimming. Typical values range from thousands to millions depending on retention needs.',
      },
      {
        displayName: 'Stream TTL (seconds)',
        name: 'ttlSec',
        type: 'number',
        default: 0,
        description:
          'Optional key TTL. If > 0, EXPIRE <stream> <ttl> is executed after XADD.',
      },
    ],
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
        const messageIdParam = (this.getNodeParameter('messageId', i) as string).trim() || '*';
        const payloadMode = this.getNodeParameter('payloadMode', i) as string;
        const maxLen = (this.getNodeParameter('maxLen', i) as number) || 0;
        const ttlSec = (this.getNodeParameter('ttlSec', i) as number) || 0;

        if (!streamKey) {
          throw new NodeOperationError(this.getNode(), 'Stream Key is required', { itemIndex: i });
        }

        const fields: Array<[string, string]> = [];

        if (payloadMode === 'json') {
          const jsonText = (this.getNodeParameter('jsonPayload', i, '') as string).trim();
          let dataObj: unknown;
          if (jsonText) {
            try {
              dataObj = JSON.parse(jsonText);
            } catch (e) {
              throw new NodeOperationError(this.getNode(), 'Invalid JSON in Payload', { itemIndex: i });
            }
          } else {
            dataObj = items[i].json as IDataObject;
          }
          fields.push(['data', JSON.stringify(dataObj)]);
        } else {
          const payload = this.getNodeParameter('payload', i, {}) as IDataObject;
          const pairs = ((payload.pair as IDataObject[]) || [])
            .map((p) => ({ key: String(p.key ?? ''), value: String(p.value ?? '') }))
            .filter((p) => p.key.length > 0);
          if (pairs.length === 0) {
            throw new NodeOperationError(this.getNode(), 'At least one key-value pair is required in Payload', { itemIndex: i });
          }
          for (const p of pairs) fields.push([p.key, p.value]);
        }

        const cmd: string[] = ['XADD', streamKey];
        if (maxLen && maxLen > 0) {
          cmd.push('MAXLEN', '~', String(maxLen));
        }
        cmd.push(messageIdParam || '*');
        for (const [k, v] of fields) {
          cmd.push(k, v);
        }

        const id = (await (client as any).sendCommand(cmd)) as string;

        if (ttlSec && ttlSec > 0) {
          await (client as any).sendCommand(['EXPIRE', streamKey, String(ttlSec)]);
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
