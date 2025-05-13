import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { nodeDescription } from './config/description';
import { getTokenDetails } from './functions/getTokenDetails';
import { createToken } from './functions/createToken';
import { swapToken } from './functions/swapToken';
import { OPERATIONS, DEFAULT_CHAIN_ID } from './constants';

export class BaseAgent implements INodeType {
	description: INodeTypeDescription = nodeDescription;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

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
						result = await createToken({
							tokenName: name,
							tokenSymbol: symbol,
							decimals: 18,
							initialSupply: totalSupply,
						}, DEFAULT_CHAIN_ID);
						break;

					case OPERATIONS.SWAP_TOKEN:
						const fromToken = this.getNodeParameter('fromToken', i) as string;
						const toToken = this.getNodeParameter('toToken', i) as string;
						const amount = this.getNodeParameter('amount', i) as number;
						const slippage = this.getNodeParameter('slippage', i) as number;
						result = await swapToken({
							fromToken,
							toToken,
							amount: amount.toString(),
							slippage,
						}, DEFAULT_CHAIN_ID);
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
