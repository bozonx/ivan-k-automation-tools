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
    const blockMs = 10000;
    const count = 50;
    const persistLastId = true;

    if (!streamKey) {
      throw new NodeOperationError(this.getNode(), 'Stream Key is required');
    }

    const staticData = this.getWorkflowStaticData('node') as { lastId?: string } & IDataObject;

    let lastId: string = staticData.lastId ?? '$';

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
            if (Object.keys(fields).length === 1 && (fields as any).data !== undefined) {
              try {
                const parsed = JSON.parse((fields as any).data as unknown as string);
                json = (typeof parsed === 'object' && parsed !== null)
                  ? (parsed as IDataObject)
                  : { value: parsed };
              } catch {
                json = { data: (fields as any).data } as IDataObject;
              }
              (json as IDataObject)._stream = streamKey;
              (json as IDataObject)._id = id;
            } else {
              json = { ...fields, _stream: streamKey, _id: id } as IDataObject;
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
