import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class BozonxTelegramFileProxyApi implements ICredentialType {
	name = 'bozonxTelegramFileProxyApi';
	displayName = 'Telegram File Proxy API';
	documentationUrl =
		'https://github.com/bozonx/ivan-k-automation-tools/tree/main/n8n-nodes-bozonx-telegram-file-proxy#readme';
	properties: INodeProperties[] = [
		{
			displayName: 'Telegram Bot Token',
			name: 'botToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
			description: 'Telegram Bot API token from @BotFather',
		},
		{
			displayName: 'Worker URL',
			name: 'workerUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'https://telegram-file-proxy.your-account.workers.dev',
			description: 'Cloudflare Worker URL (without trailing slash)',
		},
		{
			displayName: 'AES Key',
			name: 'aesKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			placeholder: 'aGVsbG93b3JsZA==',
			description:
				'AES-256 key in base64 format (must match worker KEY_BASE64). Generate with: openssl rand -base64 32',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.workerUrl}}',
			url: '/',
			method: 'GET',
			qs: {
				q: 'dGVzdA==', // base64("test") - will fail decryption but tests reachability
			},
			skipSslCertificateValidation: false,
		},
	};
}
