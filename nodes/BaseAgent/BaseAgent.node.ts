import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { Hex } from 'viem';
import { nodeProperties } from './config/properties';
import { DEFAULT_CHAIN_ID, OPERATIONS } from './constants';
import { createToken } from './functions/createToken';
import { getTokenDetails } from './functions/getTokenDetails';
import { swapToken } from './functions/swapToken';

const nodeDescription: INodeTypeDescription = {
	displayName: 'Base Agent',
	name: 'baseAgent',
	icon: 'file:base.svg',
	group: ['transform'],
	version: 1,
	subtitle: '={{$parameter["operation"]}}',
	description: 'Interact with Base on-chain AI agents',
	defaults: {
		name: 'Base Agent',
	},
	inputs: ['main'] as NodeConnectionType[],
	outputs: ['main'] as NodeConnectionType[],
	credentials: [
		{
			name: 'privateKeyApi',
			required: true,
		},
	],
	properties: nodeProperties,
};

export class BaseAgent implements INodeType {
	description: INodeTypeDescription = nodeDescription;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get the credentials
		const credentials = await this.getCredentials('privateKey');
		if (!credentials?.privateKey || !credentials?.rpcUrl) {
			returnData.push({
				json: {
					error: 'Private key and RPC URL are required',
				},
			});
			return [];
		}

		// Set the environment variables for the functions to use
		// process.env.PRIV_KEY = credentials.privateKey;
		// process.env.ALCHEMY_BASE_API = credentials.rpcUrl || (process.env.ALCHEMY_BASE_API as string);

		const privateKey = credentials.privateKey as Hex;

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				let result;
				switch (operation) {
					case OPERATIONS.GET_TOKEN_DETAILS:
						const ticker = this.getNodeParameter('ticker', i) as string;
						result = await getTokenDetails(ticker);
						break;

					case OPERATIONS.CREATE_TOKEN:
						const name = this.getNodeParameter('name', i) as string;
						const symbol = this.getNodeParameter('symbol', i) as string;
						const decimals = this.getNodeParameter('decimals', i) as number;
						const totalSupply = this.getNodeParameter('totalSupply', i) as number;
						result = await createToken(
							{
								tokenName: name,
								tokenSymbol: symbol,
								decimals,
								initialSupply: totalSupply,
							},
							DEFAULT_CHAIN_ID,
							privateKey,
						);
						break;

					case OPERATIONS.SWAP_TOKEN:
						const fromToken = this.getNodeParameter('fromToken', i) as string;
						const toToken = this.getNodeParameter('toToken', i) as string;
						const amount = this.getNodeParameter('amount', i) as number;
						const slippage = this.getNodeParameter('slippage', i) as number;
						result = await swapToken(
							{
								fromToken,
								toToken,
								amount: amount.toString(),
								slippage,
							},
							DEFAULT_CHAIN_ID,
							privateKey,
						);
						break;

					default: {
						returnData.push({
							json: {
								error: `Operation "${operation}" not supported`,
							},
						});
						return [returnData];
					}
				}

				returnData.push({
					json: result,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
