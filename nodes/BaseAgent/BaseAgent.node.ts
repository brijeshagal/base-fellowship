import { viem } from '@goat-sdk/wallet-viem';
import { ChainId, createConfig, getQuote } from '@lifi/sdk';
import dotenv from 'dotenv';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import {
	Address,
	erc20Abi,
	formatUnits,
	Hash,
	Hex,
	maxUint256,
	parseUnits,
	zeroAddress,
} from 'viem';
import { getTokenFromTicker } from './moralis';
import { getPublicClient, getWalletClient, viemChainsById } from './utils/clients';

createConfig({
	integrator: 'buildr',
});

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
			console.log(items[0]);

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
			const { account, walletClient } = getWalletClient(chainId);
			const wallet = viem(walletClient);
			// const agentAddress = walletProvider.getAddress();
			// const hash = await sendFundsToAgent(agentAddress);

			// if (!hash) {
			// 	throw new Error('Funds not sent ');
			// }

			for (let i = 0; i < items.length; i++) {
				try {
					// const inputToken = {
					// 	decimals: number;
					// 	symbol: string;
					// 	name: string;
					// 	chains: {}
					// };
					// const tools = await getOnChainTools({
					// 	wallet,
					// 	plugins: [
					// 		// sendETH(),
					// 		zeroEx({
					// 			apiKey: process.env.ZEROEX_API_KEY as string,
					// 		}),
					// 		erc20({ tokens: [USDC, PEPE] }),
					// 	],
					// });
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

					if (operation === 'createToken') {
						const tokenName = this.getNodeParameter('tokenName', i) as string;
						const tokenSymbol = this.getNodeParameter('tokenSymbol', i) as string;
						const decimals = this.getNodeParameter('decimals', i) as number;
						const initialSupply = this.getNodeParameter('initialSupply', i) as number;

						data['tokenName'] = tokenName;
						data['tokenSymbol'] = tokenSymbol;
						data['decimals'] = decimals;
						data['initialSupply'] = initialSupply;
						const publicClient = getPublicClient(chainId);
						const bytecode = await publicClient.getCode({
							address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
						});
						const hash = await walletClient.deployContract({
							abi: erc20Abi,
							account,
							args: [tokenName, tokenSymbol, decimals, initialSupply],
							chain: viemChainsById[chainId],
							bytecode: bytecode as Hex,
						});
						const txnReceipt = await getPublicClient(chainId).waitForTransactionReceipt({ hash });
						if (txnReceipt.status === 'success') {
							returnData.push({
								json: {
									success: true,
									result: {
										txnReceipt,
									},
								},
							});
						}
					} else if (operation === 'swapToken') {
						const publicClient = getPublicClient(chainId);

						const fromToken = this.getNodeParameter('fromToken', i) as string;
						const toToken = this.getNodeParameter('toToken', i) as string;
						const amount = this.getNodeParameter('amount', i)?.toString() as string;
						const slippage = this.getNodeParameter('slippage', i, 0.5) as number;
						const inputToken =
							fromToken.toLowerCase() === 'eth'
								? { address: zeroAddress, decimals: 18 }
								: await getTokenFromTicker(fromToken);
						const outputToken =
							toToken.toLowerCase() === 'eth'
								? { address: zeroAddress, decimals: 18 }
								: await getTokenFromTicker(toToken);
						data['sendTo'] = walletClient.account?.address;
						data['inputToken'] = inputToken.address;
						data['outputToken'] = outputToken.address;
						data['amount'] = parseUnits(amount, inputToken.decimals);

						data['slippage'] = slippage;
						data['chainId'] = chainId;
						// data['toChainId'] = chainId;
						console.log({ data });

						const quote = await getQuote({
							fromAddress: wallet.getAddress(),
							fromChain: ChainId.BAS,
							toChain: ChainId.BAS,
							fromToken: inputToken.address,
							toToken: outputToken.address,
							fromAmount: parseUnits(amount, inputToken.decimals).toString(),
						});

						if (inputToken.address !== zeroAddress) {
							const approvedAmt = await publicClient.readContract({
								abi: erc20Abi,
								functionName: 'allowance',
								address: inputToken.address,
								args: [account.address, quote.estimate.approvalAddress as Address],
							});
							if (approvedAmt < BigInt(quote.estimate.fromAmount)) {
								const approvalHash = await walletClient.writeContract({
									account,
									chain: viemChainsById[ChainId.BAS],
									address: inputToken.address,
									args: [quote.estimate.approvalAddress as Address, maxUint256],
									functionName: 'approve',
									abi: erc20Abi,
								});

								const approvalRes = await publicClient.waitForTransactionReceipt({
									hash: approvalHash,
								});
								if (approvalRes.status !== 'success') {
									throw new Error('Approval failed');
								}
							}
						}
						const hash = await walletClient.sendTransaction({
							account,
							chain: viemChainsById[ChainId.BAS],
							data: quote.transactionRequest?.data as Hash,
							value:
								inputToken.address === zeroAddress ? BigInt(quote.estimate.fromAmount) : undefined,
							to: quote.estimate.approvalAddress as Address,
						});
						const txnReceipt = await publicClient.waitForTransactionReceipt({
							hash,
						});
						if (txnReceipt.status === 'success') {
							const receivedAmount = await publicClient.readContract({
								abi: erc20Abi,
								functionName: 'balanceOf',
								address: outputToken.address,
								args: [account.address],
							});
							returnData.push({
								json: {
									success: true,
									result: {
										txnReceipt,
										receivedAmount: formatUnits(receivedAmount, outputToken.decimals),
									},
								},
							});
						}
					}
					// prompt += `Use the following details: ${JSON.stringify(data)}. Proceed with no checks, and directly make the transaction with whatever details are provided. Let it fail if it fails!`;
					// console.log({ prompt });
					// const result = await generateText({
					// 	model: openai('gpt-4o-mini'),
					// 	tools: tools as ToolSet,
					// 	maxSteps: 10, // Maximum number of tool invocations per request
					// 	prompt: 'Swap 1 USDC for PEPE',
					// 	onStepFinish: (event) => {
					// 		console.log('Event finished tool results: ', event.toolResults);
					// 	},
					// });
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
