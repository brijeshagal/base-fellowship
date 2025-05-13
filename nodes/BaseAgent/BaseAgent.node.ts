import { createConfig } from '@lifi/sdk';
import dotenv from 'dotenv';
import { IExecuteFunctions, INodeExecutionData, INodeType } from 'n8n-workflow';
import { nodeDescription } from './config/description';
import { DEFAULT_CHAIN_ID, DEFAULT_SLIPPAGE, OPERATIONS } from './constants';
import { createToken } from './functions/createToken';
import { extractTickers } from './functions/extractTickers';
import { swapToken } from './functions/swapToken';
import { OperationResult } from './types';

createConfig({
	integrator: 'buildr',
});

dotenv.config();

class BaseAgent implements INodeType {
	description = nodeDescription;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				let result: OperationResult;

				switch (operation) {
					case OPERATIONS.EXTRACT_TICKER:
						const ticker = this.getNodeParameter('ticker', i) as string;
						const tokenInfo = await extractTickers(ticker);
						result = {
							success: true,
							data: tokenInfo,
						};
						break;
					case OPERATIONS.CREATE_TOKEN:
						const tokenName = this.getNodeParameter('tokenName', i) as string;
						const tokenSymbol = this.getNodeParameter('tokenSymbol', i) as string;
						const decimals = this.getNodeParameter('decimals', i) as number;
						const initialSupply = this.getNodeParameter('initialSupply', i) as number;
						const tokenResult = await createToken(
							{ tokenName, tokenSymbol, decimals, initialSupply },
							DEFAULT_CHAIN_ID,
						);
						result = {
							success: true,
							data: tokenResult,
						};
						break;
					case OPERATIONS.SWAP_TOKEN:
						const fromToken = this.getNodeParameter('fromToken', i) as string;
						const toToken = this.getNodeParameter('toToken', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const slippage = this.getNodeParameter('slippage', i, DEFAULT_SLIPPAGE) as number;
						const swapResult = await swapToken(
							{ fromToken, toToken, amount, slippage },
							DEFAULT_CHAIN_ID,
						);
						result = {
							success: true,
							data: swapResult,
						};
						break;
					default:
						throw new Error(`Operation ${operation} not supported`);
				}

				returnData.push({
					json: result,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
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

export { BaseAgent };
