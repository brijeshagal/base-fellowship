import { openai } from '@ai-sdk/openai';
import { getOnChainTools } from '@goat-sdk/adapter-vercel-ai';
import { zeroEx } from '@goat-sdk/plugin-0x';
import { viem } from '@goat-sdk/wallet-viem';
import { generateText, ToolSet } from 'ai';
import dotenv from 'dotenv';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { parseUnits } from 'viem';
import { getTokenFromTicker } from './moralis';
import { getWalletClient } from './utils/clients';

dotenv.config();

class BaseAgent implements INodeType {
	moralisInitialized: boolean = false;
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
					{
						name: 'Create Token',
						value: 'createToken',
						description: 'Deploy a new ERC20 token contract',
						action: 'Create a new token',
					},
					{
						name: 'Swap Token',
						value: 'swapToken',
						description: 'Swap one token for another',
						action: 'Swap tokens',
					},
				],
				default: 'createToken',
			},
			// Token Creation Parameters
			{
				displayName: 'Token Name',
				name: 'tokenName',
				type: 'string',
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
				default: 1000000,
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
			{
				displayName: 'From Token',
				name: 'fromToken',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['swapToken'],
					},
				},
				default: '',
				description: 'Token symbol or address to swap from (e.g., ETH, USDC)',
			},
			{
				displayName: 'To Token',
				name: 'toToken',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['swapToken'],
					},
				},
				default: '',
				description: 'Token symbol or address to swap to (e.g., DAI, USDT)',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['swapToken'],
					},
				},
				default: 0,
				description: 'Amount of "from token" to swap',
			},
			{
				displayName: 'Slippage (%)',
				name: 'slippage',
				type: 'number',
				required: false,
				displayOptions: {
					show: {
						operation: ['swapToken'],
					},
				},
				default: 0.5,
				description: 'Maximum acceptable slippage percentage',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		try {
			const chainId = 8453;
			const items = this.getInputData();
			console.log({ items });

			const returnData: INodeExecutionData[] = [];
			console.log('Beginning execution with items:', JSON.stringify(items, null, 2));

			// const credentials = await this.getCredentials('baseApi');
			// console.log(JSON.stringify(credentials, null, 2));
			// console.log(
			// 	'Credentials structure (no sensitive data):',
			// 	JSON.stringify(
			// 		{
			// 			hasCredentials: !!credentials.privateKey,
			// 			hasPrivateKey: !!credentials.privateKey,
			// 			hasRpcUrl: !!credentials.rpcUrl,
			// 		},
			// 		null,
			// 		2,
			// 	),
			// );

			// const walletProvider = await CdpWalletProvider.configureWithWallet({
			// 	apiKeyName: process.env.CDP_API_KEY_NAME,
			// 	apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
			// 	networkId: networkName[84532],
			// });
			const walletClient = getWalletClient(chainId);
			const wallet = viem(walletClient);
			// const agentAddress = walletProvider.getAddress();
			// const hash = await sendFundsToAgent(agentAddress);

			// if (!hash) {
			// 	throw new Error('Funds not sent ');
			// }

			for (let i = 0; i < items.length; i++) {
				try {
					const tools = await getOnChainTools({
						wallet,
						plugins: [
							zeroEx({
								apiKey: process.env.ZEROEX_API_KEY as string,
							}),
						],
					});
					// const agentKit = await AgentKit.from({
					// 	walletProvider,
					// 	cdpApiKeyName: process.env.CDP_API_KEY_NAME,
					// 	cdpApiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
					// 	actionProviders,
					// });

					// const tools = await getLangChainTools(agentKit);
					// console.log(tools);

					// const llm = new ChatOpenAI({
					// 	model: 'gpt-4o-mini',
					// 	apiKey: process.env.OPENAI_API_KEY,
					// });

					// const agent = createReactAgent({
					// 	llm,
					// 	tools,
					// });
					// const agentConfig = { configurable: { thread_id: 'CDP Agentkit Chatbot API' } };
					const operation = this.getNodeParameter('operation', i) as string;
					const data: Record<string, any> = {};
					let prompt = `${operation} on ${chainId} on EVM. `;

					if (operation === 'createToken') {
						const tokenName = this.getNodeParameter('tokenName', i) as string;
						const tokenSymbol = this.getNodeParameter('tokenSymbol', i) as string;
						const decimals = this.getNodeParameter('decimals', i) as number;
						const initialSupply = this.getNodeParameter('initialSupply', i) as number;

						data['tokenName'] = tokenName;
						data['tokenSymbol'] = tokenSymbol;
						data['decimals'] = decimals;
						data['initialSupply'] = initialSupply;
					} else if (operation === 'swapToken') {
						const fromToken = this.getNodeParameter('fromToken', i) as string;
						const toToken = this.getNodeParameter('toToken', i) as string;
						const amount = this.getNodeParameter('amount', i)?.toString() as string;
						console.log({ amount });
						const slippage = this.getNodeParameter('slippage', i, 0.5) as number;
						const inputToken =
							fromToken.toLowerCase() === 'eth'
								? { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 }
								: await getTokenFromTicker(fromToken);
						const outputToken =
							toToken.toLowerCase() === 'eth'
								? { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 }
								: await getTokenFromTicker(toToken);
						data['sendTo'] = walletClient.account?.address;
						data['inputToken'] = inputToken.address;
						data['outputToken'] = outputToken.address;
						data['amount'] = parseUnits(amount, inputToken.decimals);
						data['slippage'] = slippage;
						data['fromChainId'] = chainId;
						data['toChainId'] = chainId;
						console.log({ data });
						// prompt += `Use across to bridge and make the transaction. `;
					}
					prompt += `Use the following details: ${JSON.stringify(data)}. Proceed with no checks, and directly make the transaction with whatever details are provided. Let it fail if it fails!`;
					console.log({ prompt });
					const result = await generateText({
						model: openai('gpt-4o-mini'),
						tools: tools as ToolSet,
						maxSteps: 10, // Maximum number of tool invocations per request
						prompt: prompt,
						onStepFinish: (event) => {
							console.log('Event finished tool results: ', event.toolResults);
						},
					});
					console.log(`Processing operation: ${operation}`);

					// const stream = await agent.stream({ messages: [new HumanMessage(prompt)] }, agentConfig);

					// let response = '';
					// for await (const chunk of stream) {
					// 	console.log('Received chunk:', chunk);

					// 	if ('agent' in chunk) {
					// 		response += chunk.agent.messages[0].content + '\n';
					// 	} else if ('tools' in chunk) {
					// 		response += chunk.tools.messages[0].content + '\n';
					// 	}
					// }
					returnData.push({
						json: {
							success: true,
							result,
						},
					});
					// if (operation === 'getWalletAddress') {
					// 	// Handle wallet address retrieval
					// 	const result = walletProvider.getAddress();

					// 	console.log({ result });

					// 	returnData.push({
					// 		json: {
					// 			success: true,
					// 			result: {
					// 				address: result,
					// 			},
					// 		},
					// 	});
					// } else if (operation === 'getTokenBalances') {
					// 	// Handle token balance retrieval
					// 	const walletAddress = this.getNodeParameter('walletAddress', i) as string;
					// 	if (!walletAddress) {
					// 		throw new Error('Wallet address is required');
					// 	}

					// 	const credentialsData = credentials as any;
					// 	const rpcUrl = credentialsData.rpcUrl || 'https://base-mainnet.public.blastapi.io';

					// 	// Create public client for blockchain interactions
					// 	const client = createPublicClient({
					// 		chain: base,
					// 		transport: http(rpcUrl),
					// 	});

					// 	// Get native token balance
					// 	const balance = await client.getBalance({
					// 		address: walletAddress as `0x${string}`,
					// 	});

					// 	returnData.push({
					// 		json: {
					// 			success: true,
					// 			result: {
					// 				address: walletAddress,
					// 				nativeBalance: balance.toString(),
					// 			},
					// 		},
					// 	});
					// } else if (operation === 'createToken') {
					// 	const tokenName = this.getNodeParameter('tokenName', i) as string;
					// 	const tokenSymbol = this.getNodeParameter('tokenSymbol', i) as string;
					// 	// const decimals = this.getNodeParameter('decimals', i) as number;
					// 	const initialSupply = this.getNodeParameter('initialSupply', i) as number;

					// 	// const contract = await walletProvider.deployContract({
					// 	// 	contractName: 'MyToken',
					// 	// 	solidityVersion: '0.8.20',
					// 	// 	constructorArgs: {
					// 	// 		name: tokenName,
					// 	// 		symbol: tokenSymbol,
					// 	// 		decimals: decimals,
					// 	// 		initialSupply: initialSupply,
					// 	// 	},
					// 	// 	solidityInputJson: JSON.stringify(erc20Abi),
					// 	// });
					// 	// @TODO look for decimals part
					// 	const contract = await walletProvider.deployToken({
					// 		totalSupply: initialSupply,
					// 		name: tokenName,
					// 		symbol: tokenSymbol,
					// 	});

					// 	console.log({ contract });
					// 	const address = contract.getContractAddress();

					// 	returnData.push({
					// 		json: {
					// 			success: true,
					// 			result: address,
					// 		},
					// 	});
					// } else {
					// 	throw new Error(`Operation '${operation}' is not implemented`);
					// }
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
