import { AgentKit, CdpWalletProvider } from '@coinbase/agentkit';
import { getLangChainTools } from '@coinbase/agentkit-langchain';
import { MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import { networkName } from '../constants/network';
import { actionProviders } from '../utils/actionProviders';

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
			console.log("items: ", {items})

			// Get credentials
			// const credentials = await this.getCredentials('baseApi');
			const chainId = 84532;
			const networkId = networkName[chainId];

			// Initialize Wallet Provider
			const walletProvider = await CdpWalletProvider.configureWithWallet({
				apiKeyName: process.env.CDP_API_KEY_NAME,
				apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
				networkId: networkId,
			});

			// Initialize Base Agent Kit
			const agentKit = await AgentKit.from({
				walletProvider,
				actionProviders,
			});

			const llm = new ChatOpenAI({
				apiKey: process.env.OPENAI_API_KEY,
				model: 'gpt-4-turbo-preview',
				temperature: 0.7,
			});

			const tools = await getLangChainTools(agentKit);
			const memory = new MemorySaver();

			const agent = createReactAgent({
				llm,
				tools,
				checkpointSaver: memory,
				messageModifier: `You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. Be concise and helpful with your responses.`,
			});

			for (let i = 0; i < items.length; i++) {
				const operation = this.getNodeParameter('operation', i) as string;
				try {
					let result;

					switch (operation) {
						case 'getTokenBalances':
							try {
								// Retrieve the wallet address from node parameters
								const walletAddress = this.getNodeParameter('walletAddress', i) as string;
								if (!walletAddress) {
									throw new NodeOperationError(
										this.getNode(),
										'Wallet address is required for getTokenBalances operation.',
									);
								}
								console.log('Fetching token balances for wallet:', walletAddress);

								// Construct the message for the agent
								const message = {
									messages: [
										{
											content: `Get all token balances for the wallet address ${walletAddress} on the Base network.`,
											role: 'user',
										},
									],
								};

								// Stream the agent's response
								const stream = await agent.stream(message, {
									configurable: { thread_id: 'AgentKit Discussion' },
								});
								console.log({ stream });

								console.log('Token balances:', result);
							} catch (error) {
								if (this.continueOnFail()) {
									result = { error: error };
								} else {
									throw error;
								}
							}
							break;

						default:
							throw new NodeOperationError(
								this.getNode(),
								`The operation "${operation}" is not supported!`,
							);
					}

					returnData.push({
						json: { result },
					});
				} catch (error) {
					if (this.continueOnFail()) {
						returnData.push({
							json: {
								error: error || "",
							},
						});
						continue;
					}
					throw error;
				}
			}

			return [returnData];
		} catch (e) {
			console.log("execute function error: ",  {e})
			return [];
		}
	}
}

// Export the class
export { BaseAgent };
