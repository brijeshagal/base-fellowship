import type {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PrivateKeyApi implements ICredentialType {
	name = 'privateKeyApi';

	displayName = 'Private Key API';

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
			required: true,
			description: 'Your wallet private key',
		},
		{
			displayName: 'RPC URL',
			name: 'rpcUrl',
			type: 'string',
			default: '',
			required: false,
			description: 'The RPC URL for the Base network',
		},
	];
}