import type { ICredentialType, Icon, INodeProperties } from 'n8n-workflow';

export class Redis implements ICredentialType {
  name = 'bozonxRedis';
  displayName = 'Redis';
  documentationUrl = 'https://github.com/bozonx/ivan-k-automation-tools/tree/main/n8n-nodes-bozonx-redis-qos1events#readme';
  icon: Icon = { light: 'file:../nodes/RedisStreamProducer/redis-stream-producer.svg', dark: 'file:../nodes/RedisStreamProducer/redis-stream-producer.dark.svg' };
  testedBy = ['bozonxRedisStreamProducer', 'bozonxRedisStreamTrigger'];
  properties: INodeProperties[] = [
    {
      displayName: 'Host',
      name: 'host',
      type: 'string',
      default: 'localhost',
      required: true,
      placeholder: 'localhost',
      description: 'Redis host name or IP address',
    },
    {
      displayName: 'Port',
      name: 'port',
      type: 'number',
      typeOptions: { minValue: 1, maxValue: 65535 },
      default: 6379,
      required: true,
      description: 'Redis TCP port number',
    },
    {
      displayName: 'Username',
      name: 'username',
      type: 'string',
      default: '',
      placeholder: 'myuser',
      description: 'Redis ACL username (leave empty if not required)',
    },
    {
      displayName: 'Password',
      name: 'password',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      placeholder: '********',
      description: 'Password for authentication (leave empty if not required)',
    },
    {
      displayName: 'TLS',
      name: 'tls',
      type: 'boolean',
      default: false,
      description: 'Enable TLS/SSL encryption for the connection',
    },
    {
      displayName: 'DB Index',
      name: 'db',
      type: 'number',
      typeOptions: { minValue: 0, maxValue: 15 },
      default: 0,
      description: 'Database index number (0 by default)',
    },
  ];
}
