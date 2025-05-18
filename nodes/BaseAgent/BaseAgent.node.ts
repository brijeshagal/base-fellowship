import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import type { Hex } from 'viem';

import { nodeProperties } from './config/properties';
import { DEFAULT_CHAIN_ID, OPERATIONS } from './constants';
import { createToken } from './functions/createToken';
import { getTokenDetails } from './functions/getTokenDetails';
import { swapToken } from './functions/swapToken';
import { getAbi } from './functions/getAbi';
import { createNFT } from './functions/createNFT';
import { getCurrentPrice } from './functions/getCurrentPrice';

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
		{
			name: 'baseScanApi',
			required: false,
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
		const baseScanCredentials = await this.getCredentials('baseScanApi');
		
		if (!credentials?.privateKey || !credentials?.rpcUrl) {
			returnData.push({
				json: {
					error: 'Private key and RPC URL are required',
				},
			});
			return [];
		}

		const privateKey = credentials.privateKey as Hex;
		const baseScanApiKey = baseScanCredentials?.apiKey as string | undefined;

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

					case OPERATIONS.GET_ABI:
						const contractAddress = this.getNodeParameter('contractAddress', i) as string;
						result = await getAbi(contractAddress, DEFAULT_CHAIN_ID, baseScanApiKey);
						break;

					case OPERATIONS.CREATE_NFT:
						const nftName = this.getNodeParameter('name', i) as string;
						const nftSymbol = this.getNodeParameter('symbol', i) as string;
						const baseURI = this.getNodeParameter('baseURI', i) as string;
						result = await createNFT(
							{
								name: nftName,
								symbol: nftSymbol,
								baseURI,
							},
							DEFAULT_CHAIN_ID,
							privateKey,
						);
						break;

					case OPERATIONS.GET_CURRENT_PRICE:
						const tokenSymbol = this.getNodeParameter('tokenSymbol', i) as string;
						result = await getCurrentPrice(tokenSymbol);
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
