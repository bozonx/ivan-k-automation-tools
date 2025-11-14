import {
	NodeOperationError,
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { createCipheriv, randomBytes } from 'crypto';

export class BozonxTelegramFileProxy implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Telegram File Proxy',
		name: 'bozonxTelegramFileProxy',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["fileId"]}}',
		description: 'Encrypt Telegram file URLs for proxying through Cloudflare Worker',
		defaults: { name: 'Telegram File Proxy' },
		icon: 'file:telegram-file-proxy.svg',
		inputs: ['main'],
		outputs: ['main'],
		documentationUrl:
			'https://github.com/bozonx/ivan-k-automation-tools/tree/main/n8n-nodes-bozonx-telegram-file-proxy#readme',
		credentials: [
			{
				name: 'bozonxTelegramFileProxyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'AgACAgIAAxkBAAIBY2...',
				description: 'Telegram file_id. The node will automatically call getFile API to get the file_path.',
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const creds = await this.getCredentials('bozonxTelegramFileProxyApi');
		const botToken = (creds.botToken as string).trim();
		const workerUrl = (creds.workerUrl as string).trim().replace(/\/$/, '');
		const aesKeyRaw = (creds.aesKey as string).trim();

		if (!botToken || !workerUrl || !aesKeyRaw) {
			throw new NodeOperationError(
				this.getNode(),
				'Credentials are incomplete: botToken, workerUrl, and aesKey are required',
			);
		}

		const keyBytes = parseKey(aesKeyRaw);
		if (keyBytes.length !== 32) {
			throw new NodeOperationError(this.getNode(), 'AES key must be 32 bytes (256 bits)');
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const fileId = (this.getNodeParameter('fileId', i) as string).trim();
				if (!fileId) {
					throw new NodeOperationError(this.getNode(), 'File ID must not be empty', {
						itemIndex: i,
					});
				}

				// Call getFile API to get file_path
				const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`;
				const getFileResponse = await fetch(getFileUrl);
				if (!getFileResponse.ok) {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to get file info: ${getFileResponse.status} ${getFileResponse.statusText}`,
						{ itemIndex: i },
					);
				}

				const getFileData = await getFileResponse.json() as {
					ok: boolean;
					result?: { file_path?: string };
				};
				if (!getFileData.ok || !getFileData.result?.file_path) {
					throw new NodeOperationError(
						this.getNode(),
						'Invalid response from getFile API or file not found',
						{ itemIndex: i },
					);
				}

				const filePath = getFileData.result.file_path;

				// Build Telegram file URL
				const telegramUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

				// Encrypt URL
				const iv = randomBytes(16);
				const cipher = createCipheriv('aes-256-cbc', keyBytes, iv);
				const encrypted = Buffer.concat([cipher.update(telegramUrl, 'utf8'), cipher.final()]);

				// Build container JSON
				const container = {
					iv: iv.toString('base64'),
					data: encrypted.toString('base64'),
				};
				const containerJson = JSON.stringify(container);
				const containerB64 = Buffer.from(containerJson, 'utf8').toString('base64');

				// Build final worker URL
				const encryptedUrl = `${workerUrl}/?q=${encodeURIComponent(containerB64)}`;

				returnData.push({
					json: { encryptedUrl } as IDataObject,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message } as IDataObject,
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

function parseKey(raw: string): Buffer {
	if (raw.startsWith('base64:')) {
		return Buffer.from(raw.slice(7), 'base64');
	}
	if (raw.startsWith('hex:')) {
		return Buffer.from(raw.slice(4), 'hex');
	}
	// Treat as UTF-8 string
	return Buffer.from(raw, 'utf8');
}
