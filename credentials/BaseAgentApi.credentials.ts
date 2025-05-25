import type {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class BaseAgentApi implements ICredentialType {
	name = 'baseAgentApi';

	displayName = 'Base Agent API';

	documentationUrl = 'https://github.com/brijeshagal/base-fellowship';

	properties: INodeProperties[] = [
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: false,
			description: 'Your wallet private key',
		},
		// {
		// 	displayName: 'RPC URL',
		// 	name: 'rpcUrl',
		// 	type: 'string',
		// 	default: '',
		// 	required: false,
		// 	description: 'The RPC URL for the Base network',
		// },
		{
			displayName: 'Base Scan API Key',
			name: 'baseScanApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: false,
			description: 'Your BaseScan API key. Get it from https://basescan.org/apis',
		},
	];
}