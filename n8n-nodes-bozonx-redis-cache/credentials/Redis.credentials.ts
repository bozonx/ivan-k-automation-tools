import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class BozonxRedis implements ICredentialType {
	name = 'bozonxRedis';
	displayName = 'Redis';
	properties: INodeProperties[] = [
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			default: 'localhost',
			required: true,
			description: 'Redis host',
		},
		{
			displayName: 'Port',
			name: 'port',
			type: 'number',
			default: 6379,
			required: true,
			description: 'Redis port',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			description: 'ACL username (optional)',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Password (optional)',
		},
		{
			displayName: 'TLS',
			name: 'tls',
			type: 'boolean',
			default: false,
			description: 'Enable TLS for the connection',
		},
		{
			displayName: 'DB Index',
			name: 'db',
			type: 'number',
			default: 0,
			description: 'Database index',
		},
	];
}
