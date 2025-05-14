import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PrivateKey implements ICredentialType {
	name = 'privateKey';
	displayName = 'Private Key';
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