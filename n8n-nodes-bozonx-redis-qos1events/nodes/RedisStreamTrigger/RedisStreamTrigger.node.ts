import {
  type ITriggerFunctions,
  type INodeType,
  type INodeTypeDescription,
  NodeOperationError,
  type ITriggerResponse,
  type IDataObject,
} from 'n8n-workflow';
import { getRedisClientConnected } from '../RedisStreamProducer/redisClient';

export class RedisStreamTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Redis Stream Trigger',
    name: 'bozonxRedisStreamTrigger',
    group: ['trigger'],
    version: 1,
    description: 'Emit items when events appear in a Redis Stream (XREAD)',
    defaults: { name: 'Redis Stream Trigger' },
    icon: 'file:redis-stream-trigger.svg',
    inputs: [],
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
        description: 'Redis Stream key to read messages from, e.g. "events:stt"',
      },
      {
        displayName: 'Starting Position',
        name: 'startFrom',
        type: 'options',
        options: [
          { name: 'From Now (Only New)', value: 'now', description: 'Start from the latest ID ($)' },
          { name: 'From Beginning', value: 'begin', description: 'Start from 0-0' },
          { name: 'From Specific ID', value: 'id', description: 'Start from a provided ID' },
        ],
        default: 'now',
      },
      {
        displayName: 'Start ID',
        name: 'startId',
        type: 'string',
        default: '0-0',
        displayOptions: { show: { startFrom: ['id'] } },
        description: 'Redis Stream ID to start reading from (exclusive)',
      },
      {
        displayName: 'Block Time (ms)',
        name: 'blockMs',
        type: 'number',
        default: 10000,
        description: 'How long to block for new messages per request. Use 0 for no block (not recommended).',
      },
      {
        displayName: 'Batch Size',
        name: 'count',
        type: 'number',
        default: 50,
        description: 'Maximum number of entries to read per request',
      },
      {
        displayName: 'Output Mode',
        name: 'outputMode',
        type: 'options',
        options: [
          { name: 'Auto (JSON if single "data" field)', value: 'auto' },
          { name: 'Fields Object', value: 'fields' },
          { name: 'Raw (id, stream, fields)', value: 'raw' },
        ],
        default: 'auto',
      },
      {
        displayName: 'Persist Last ID',
        name: 'persistLastId',
        type: 'boolean',
        default: true,
        description: 'Persist the last processed ID across workflow restarts',
      },
    ],
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const creds = await this.getCredentials('bozonxRedisStreams');
    const host = (creds?.host as string) || 'localhost';
    const port = (creds?.port as number) ?? 6379;
    const username = (creds?.username as string) || '';
    const password = (creds?.password as string) || '';
    const tls = (creds?.tls as boolean) || false;
    const db = (creds?.db as number) ?? 0;

    const client = await getRedisClientConnected({ host, port, username, password, tls, db });

    const streamKey = (this.getNodeParameter('streamKey', 0) as string).trim();
    const startFrom = this.getNodeParameter('startFrom', 0) as string;
    const startIdParam = (this.getNodeParameter('startId', 0) as string) || '0-0';
    const blockMs = (this.getNodeParameter('blockMs', 0) as number) || 10000;
    const count = (this.getNodeParameter('count', 0) as number) || 50;
    const outputMode = (this.getNodeParameter('outputMode', 0) as string) || 'auto';
    const persistLastId = (this.getNodeParameter('persistLastId', 0) as boolean) || false;

    if (!streamKey) {
      throw new NodeOperationError(this.getNode(), 'Stream Key is required');
    }

    const staticData = this.getWorkflowStaticData('node') as { lastId?: string } & IDataObject;

    let lastId: string;
    if (persistLastId && staticData.lastId) {
      lastId = staticData.lastId;
    } else if (startFrom === 'now') {
      lastId = '$';
    } else if (startFrom === 'begin') {
      lastId = '0-0';
    } else {
      lastId = startIdParam || '0-0';
    }

    type RedisClientLike = { sendCommand(args: string[]): Promise<any> };
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
              fields[k] = v;
            }

            let json: IDataObject;
            if (outputMode === 'raw') {
              json = { stream: streamKey, id, fields };
            } else if (outputMode === 'fields') {
              json = { ...fields, _stream: streamKey, _id: id };
            } else {
              // auto
              if (Object.keys(fields).length === 1 && fields.data !== undefined) {
                try {
                  const parsed = JSON.parse(fields.data);
                  json = (typeof parsed === 'object' && parsed !== null) ? (parsed as IDataObject) : { value: parsed };
                } catch {
                  json = { data: fields.data };
                }
                (json as IDataObject)._stream = streamKey;
                (json as IDataObject)._id = id;
              } else {
                json = { ...fields, _stream: streamKey, _id: id };
              }
            }

            outItems.push({ json });
          }

          if (outItems.length > 0) {
            // Emit to workflow
            this.emit([outItems]);
          }
        } catch (error) {
          // Temporary error while reading; wait briefly and retry
          await new Promise((r) => (globalThis as any).setTimeout(r, 1000));
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
        // Allow manual test by making one quick non-blocking read
        try {
          const cmd: string[] = ['XREAD', 'COUNT', '5', 'BLOCK', '1', 'STREAMS', streamKey, lastId];
          await c.sendCommand(cmd);
        } catch {
          // ignore
        }
      },
    };
  }
}
