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
import { compileContract } from './functions/compileContract';
import { createNFT } from './functions/createNFT';
import { createToken } from './functions/createToken';
import { earnYield } from './functions/earnYield';
import { getAbi } from './functions/getAbi';
import { getCurrentPriceByAddress } from './functions/getCurrentPrice';
import { getStandardAbi, type StandardAbiType } from './functions/getStandardAbi';
import { getTokenDetails } from './functions/getTokenDetails';
import { purchaseItem } from './functions/purchaseItem';
import { sendPayment } from './functions/sendPayment';
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
			name: 'baseAgentApi',
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
		const credentials = await this.getCredentials('baseAgentApi');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i);

				let result;
				switch (operation) {
					case OPERATIONS.GET_TOKEN_DETAILS:
						const ticker = this.getNodeParameter('ticker', i) as string;
						result = await getTokenDetails(ticker);
						break;

					case OPERATIONS.CREATE_TOKEN: {
						const privateKey = credentials.privateKey as Hex;
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
					}
					case OPERATIONS.SWAP_TOKEN: {
						const privateKey = credentials.privateKey as Hex;
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
					}

					case OPERATIONS.GET_ABI: {
						const baseScanApiKey = credentials.baseScanApiKey as string | undefined;
						const contractAddress = this.getNodeParameter('contractAddress', i) as string;
						result = await getAbi(contractAddress, DEFAULT_CHAIN_ID, baseScanApiKey);
						break;
					}

					case OPERATIONS.CREATE_NFT: {
						const privateKey = credentials.privateKey as Hex;
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
					}
					case OPERATIONS.GET_CURRENT_PRICE: {
						const tokenSymbol = this.getNodeParameter('tokenSymbol', i) as string;
						result = await getCurrentPriceByAddress(tokenSymbol);
						break;
					}
					case OPERATIONS.SEND_PAYMENT: {
						const privateKey = credentials.privateKey as Hex;
						const to = this.getNodeParameter('to', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const tokenAddress = this.getNodeParameter('tokenAddress', i) as string | undefined;
						result = await sendPayment(
							{
								to,
								amount,
								tokenAddress,
							},
							privateKey,
						);
						break;
					}

					case OPERATIONS.PURCHASE_ITEM: {
						const privateKey = credentials.privateKey as Hex;
						const itemId = this.getNodeParameter('itemId', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const tokenAddress = this.getNodeParameter('tokenAddress', i) as string | undefined;
						const marketplaceAddress = this.getNodeParameter('marketplaceAddress', i) as string;
						result = await purchaseItem(
							{
								itemId,
								amount,
								tokenAddress,
								marketplaceAddress,
							},
							DEFAULT_CHAIN_ID,
							privateKey,
						);
						break;
					}

					case OPERATIONS.EARN_YIELD: {
						const privateKey = credentials.privateKey as Hex;
						const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const stakingPoolAddress = this.getNodeParameter('stakingPoolAddress', i) as string;
						result = await earnYield(
							{
								tokenAddress,
								amount,
								stakingPoolAddress,
							},
							DEFAULT_CHAIN_ID,
							privateKey,
						);
						break;
					}

					case OPERATIONS.COMPILE_CONTRACT: {
						const sourceCode = this.getNodeParameter('sourceCode', i) as string;
						const contractName = this.getNodeParameter('contractName', i) as string;
						const optimization = this.getNodeParameter('optimization', i) as boolean;
						const version = this.getNodeParameter('version', i) as string;

						result = await compileContract({
							sourceCode,
							contractName,
							optimization,
							version,
						});
						break;
					}

					case OPERATIONS.GET_STANDARD_ABI: {
						const abiType = this.getNodeParameter('abiType', i) as StandardAbiType;
						result = await getStandardAbi({ abiType });
						break;
					}

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
