import { AgentKit, CdpWalletProvider } from '@coinbase/agentkit';
import { getLangChainTools } from '@coinbase/agentkit-langchain';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

dotenv.config();

class BaseAgent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Base Agent',
		name: 'baseAgent',
		icon: 'file:base.svg',
		group: ['blockchain'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Base onchain AI agents',
		defaults: {
			name: 'Base Agent',
		},
		inputs: [
			{
				displayName: 'Input',
				maxConnections: 1,
				required: true,
				type: NodeConnectionType.Main,
			},
		],
		outputs: [
			{
				displayName: 'Output',
				maxConnections: 1,
				type: NodeConnectionType.Main,
			},
		],
		credentials: [
			{
				name: 'baseApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
				options: [
					{
						name: 'Get Wallet Address',
						value: 'getWalletAddress',
						description: 'Get current wallet address',
						action: 'Get wallet address',
					},
				],
				default: 'getWalletAddress',
			},
			// Token Creation Parameters
			{
				displayName: 'Token Name',
				name: 'tokenName',
				type: 'string',
				typeOptions: { password: true },
				required: true,
				displayOptions: {
					show: {
						operation: ['createToken'],
					},
				},
				default: '',
				description: 'Name of the token to create',
			},
			{
				displayName: 'Token Symbol',
				name: 'tokenSymbol',
				type: 'string',
				typeOptions: { password: true },
				required: true,
				displayOptions: {
					show: {
						operation: ['createToken'],
					},
				},
				default: '',
				description: 'Symbol of the token to create',
			},
			{
				displayName: 'Decimals',
				name: 'decimals',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['createToken'],
					},
				},
				default: 9,
				description: 'Number of decimal places for the token',
			},
			{
				displayName: 'Initial Supply',
				name: 'initialSupply',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['createToken'],
					},
				},
				default: 0,
				description: 'Initial supply of tokens to mint',
			},
			// Transfer Parameters
			{
				displayName: 'Recipient Address',
				name: 'recipientAddress',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['transferToken'],
					},
				},
				default: '',
				description: 'Recipient wallet address',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['transferToken'],
					},
				},
				default: 0,
				description: 'Amount to transfer',
			},
			{
				displayName: 'Token Address',
				name: 'tokenAddress',
				type: 'string',
				typeOptions: { password: true },
				displayOptions: {
					show: {
						operation: ['transferToken', 'getSingleBalance'],
					},
				},
				default: '',
				description: 'SPL token address (leave empty for SOL)',
			},
			// Balance Parameters
			{
				displayName: 'Wallet Address',
				name: 'walletAddress',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['getTokenBalances', 'getOtherBalance'],
					},
				},
				default: '',
				description: 'Wallet address to check balances for (leave empty for own wallet)',
			},
			{
				displayName: 'Token Address for Other Wallet',
				name: 'otherTokenAddress',
				type: 'string',
				typeOptions: { password: true },
				displayOptions: {
					show: {
						operation: ['getOtherBalance'],
					},
				},
				default: '',
				description: 'Token address to check balance for (leave empty for SOL)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		try {
			const items = this.getInputData();
			const returnData: INodeExecutionData[] = [];
			console.log('Beginning execution with items:', JSON.stringify(items, null, 2));

			const credentials = await this.getCredentials('baseApi');
			console.log(JSON.stringify(credentials, null, 2));
			console.log(
				'Credentials structure (no sensitive data):',
				JSON.stringify(
					{
						hasCredentials: !!credentials.privateKey,
						hasPrivateKey: !!credentials.privateKey,
						hasRpcUrl: !!credentials.rpcUrl,
					},
					null,
					2,
				),
			);

			const walletProvider = await CdpWalletProvider.configureWithWallet({
				apiKeyName: 'brijesh',
				apiKeyPrivateKey: credentials.privateKey as string,
				networkId: 'base-sepolia',
			});

			const agentKit = await AgentKit.from({
				walletProvider,
				cdpApiKeyName: process.env.CDP_API_KEY_NAME,
				cdpApiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
			});

			const tools = await getLangChainTools(agentKit);

			const llm = new ChatOpenAI({
				model: 'gpt-4o-mini',
			});

			const agent = createReactAgent({
				llm,
				tools,
			});

			agent;

			for (let i = 0; i < items.length; i++) {
				try {
					const operation = this.getNodeParameter('operation', i) as string;
					console.log(`Processing operation: ${operation}`);

					if (operation === 'getWalletAddress') {
						// Handle wallet address retrieval
						const result = walletProvider.getAddress();

						returnData.push({
							json: {
								success: true,
								result: {
									address: result,
								},
							},
						});
					} else if (operation === 'getTokenBalances') {
						// Handle token balance retrieval
						const walletAddress = this.getNodeParameter('walletAddress', i) as string;
						if (!walletAddress) {
							throw new Error('Wallet address is required');
						}

						const credentialsData = credentials as any;
						const rpcUrl = credentialsData.rpcUrl || 'https://base-mainnet.public.blastapi.io';

						// Create public client for blockchain interactions
						const client = createPublicClient({
							chain: base,
							transport: http(rpcUrl),
						});

						// Get native token balance
						const balance = await client.getBalance({
							address: walletAddress as `0x${string}`,
						});

						returnData.push({
							json: {
								success: true,
								result: {
									address: walletAddress,
									nativeBalance: balance.toString(),
								},
							},
						});
					} else {
						throw new Error(`Operation '${operation}' is not implemented`);
					}
				} catch (itemError) {
					console.error(`Error processing item ${i}:`, itemError);
					if (this.continueOnFail()) {
						returnData.push({
							json: {
								success: false,
								error: itemError.message,
							},
						});
					} else {
						throw itemError;
					}
				}
			}

			return [returnData];
		} catch (e) {
			console.error('Execution failed with error:', {
				message: e.message,
				stack: e.stack,
			});

			return [
				[
					{
						json: {
							success: false,
							error: e.message || 'An unexpected error occurred',
						},
					},
				],
			];
		}
	}
}

// Export the class
export { BaseAgent };
