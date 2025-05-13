import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { Hex } from 'viem';
import { nodeDescription } from './config/description';
import { DEFAULT_CHAIN_ID, OPERATIONS } from './constants';
import { createToken } from './functions/createToken';
import { getTokenDetails } from './functions/getTokenDetails';
import { swapToken } from './functions/swapToken';

export class BaseAgent implements INodeType {
	description: INodeTypeDescription = nodeDescription;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get the private key from credentials
		const credentials = await this.getCredentials('privateKey');
		if (!credentials?.privateKey) {
			throw new Error('Private key is required');
		}

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
						const totalSupply = this.getNodeParameter('totalSupply', i) as number;
						result = await createToken(
							{
								tokenName: name,
								tokenSymbol: symbol,
								decimals: 18,
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

					default:
						throw new Error(`Operation "${operation}" not supported`);
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
