import type { INodeProperties, NodePropertyTypes } from 'n8n-workflow';

import { OPERATIONS, OPERATION_DESCRIPTIONS, OPERATION_DISPLAY_NAMES } from '../constants';
import { STANDARD_ABIS } from '../functions/getStandardAbi';

export const operationProperty: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	default: '',
	noDataExpression: true,
	options: Object.values(OPERATIONS).map((operation) => ({
		name: OPERATION_DISPLAY_NAMES[operation],
		value: operation,
		description: OPERATION_DESCRIPTIONS[operation],
	})),
};

export const tokenDetailsProperties: INodeProperties[] = [
	{
		displayName: 'Ticker Symbol',
		name: 'ticker',
		type: 'string',
		required: true,
		default: '',
		description: 'The token ticker symbol to get details for (e.g., ETH, USDC, DAI)',
		displayOptions: {
			show: {
				operation: [OPERATIONS.GET_TOKEN_DETAILS],
			},
		},
	},
];

export const tokenCreationProperties: INodeProperties[] = [
	{
		displayName: 'Token Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'The name of the token to create',
		displayOptions: {
			show: {
				operation: [OPERATIONS.CREATE_TOKEN],
			},
		},
	},
	{
		displayName: 'Token Symbol',
		name: 'symbol',
		type: 'string',
		required: true,
		default: '',
		description: 'The symbol of the token to create',
		displayOptions: {
			show: {
				operation: [OPERATIONS.CREATE_TOKEN],
			},
		},
	},
	{
		displayName: 'Decimals',
		name: 'decimals',
		type: 'number',
		required: true,
		default: 9,
		description: 'Number of decimal places for the token',
		displayOptions: {
			show: {
				operation: [OPERATIONS.CREATE_TOKEN],
			},
		},
	},
	{
		displayName: 'Total Supply',
		name: 'totalSupply',
		type: 'number',
		required: true,
		default: 1000000,
		description: 'The total supply of the token to create',
		displayOptions: {
			show: {
				operation: [OPERATIONS.CREATE_TOKEN],
			},
		},
	},
];

export const swapTokenProperties: INodeProperties[] = [
	{
		displayName: 'From Token',
		name: 'fromToken',
		type: 'string' as NodePropertyTypes,
		required: true,
		default: '',
		description: 'The token to swap from (ticker symbol)',
		displayOptions: {
			show: {
				operation: [OPERATIONS.SWAP_TOKEN],
			},
		},
	},
	{
		displayName: 'To Token',
		name: 'toToken',
		type: 'string' as NodePropertyTypes,
		required: true,
		default: '',
		description: 'The token to swap to (ticker symbol)',
		displayOptions: {
			show: {
				operation: [OPERATIONS.SWAP_TOKEN],
			},
		},
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		required: true,
		default: 1,
		description: 'The amount of tokens to swap',
		displayOptions: {
			show: {
				operation: [OPERATIONS.SWAP_TOKEN],
			},
		},
	},
	{
		displayName: 'Slippage',
		name: 'slippage',
		type: 'number',
		default: 0.5,
		description: 'The maximum allowed slippage in percentage',
		displayOptions: {
			show: {
				operation: [OPERATIONS.SWAP_TOKEN],
			},
		},
	},
];

export const getAbiProperties: INodeProperties[] = [
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		required: true,
		default: '',
		description: 'The address of the contract to get the ABI for',
		displayOptions: {
			show: {
				operation: [OPERATIONS.GET_ABI],
			},
		},
	},
];

export const createNFTProperties: INodeProperties[] = [
	{
		displayName: 'NFT Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'The name of the NFT collection',
		displayOptions: {
			show: {
				operation: [OPERATIONS.CREATE_NFT],
			},
		},
	},
	{
		displayName: 'NFT Symbol',
		name: 'symbol',
		type: 'string',
		required: true,
		default: '',
		description: 'The symbol of the NFT collection',
		displayOptions: {
			show: {
				operation: [OPERATIONS.CREATE_NFT],
			},
		},
	},
	{
		displayName: 'Base URI',
		name: 'baseURI',
		type: 'string',
		default: '',
		description: 'The base URI for the NFT metadata',
		displayOptions: {
			show: {
				operation: [OPERATIONS.CREATE_NFT],
			},
		},
	},
];

// Get Current Price Parameters
export const getCurrentPriceProperties: INodeProperties[] = [
	{
		displayName: 'Token Symbol',
		name: 'tokenSymbol',
		type: 'string' as NodePropertyTypes,
		required: true,
		default: 'ETH',
		description: 'The token symbol to get the price for (e.g., ETH, USDC, DAI)',
		displayOptions: {
			show: {
				operation: [OPERATIONS.GET_CURRENT_PRICE],
			},
		},
	}
];

// Send Payment parameters
export const sendPaymentProperties: INodeProperties[] = [
	{
		displayName: 'Recipient Address',
		name: 'to',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: [OPERATIONS.SEND_PAYMENT],
			},
		},
		default: '',
		description: 'The address to send the payment to',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: [OPERATIONS.SEND_PAYMENT, OPERATIONS.PURCHASE_ITEM, OPERATIONS.EARN_YIELD],
			},
		},
		default: '',
		description: 'The amount to send/stake',
	},
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string' as NodePropertyTypes,
		displayOptions: {
			show: {
				operation: [OPERATIONS.SEND_PAYMENT, OPERATIONS.PURCHASE_ITEM, OPERATIONS.EARN_YIELD],
			},
		},
		default: '',
		description: 'The token contract address (leave empty for native token)',
	},
];

// Purchase Item parameters
export const purchaseItemProperties: INodeProperties[] = [
	{
		displayName: 'Item ID',
		name: 'itemId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: [OPERATIONS.PURCHASE_ITEM],
			},
		},
		default: '',
		description: 'The ID of the item to purchase',
	},
	{
		displayName: 'Marketplace Address',
		name: 'marketplaceAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: [OPERATIONS.PURCHASE_ITEM],
			},
		},
		default: '',
		description: 'The address of the marketplace contract',
	},
];

// Earn Yield parameters
export const earnYieldProperties: INodeProperties[] = [
	{
		displayName: 'Staking Pool Address',
		name: 'stakingPoolAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: [OPERATIONS.EARN_YIELD],
			},
		},
		default: '',
		description: 'The address of the staking pool contract',
	},
];

// Compile Contract parameters
export const compileContractProperties: INodeProperties[] = [
	{
		displayName: 'Source Code',
		name: 'sourceCode',
		type: 'string',
		required: true,
		typeOptions: {
			rows: 10,
		},
		displayOptions: {
			show: {
				operation: [OPERATIONS.COMPILE_CONTRACT],
			},
		},
		default: '',
		description: 'The Solidity source code to compile',
	},
	{
		displayName: 'Contract Name',
		name: 'contractName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: [OPERATIONS.COMPILE_CONTRACT],
			},
		},
		default: '',
		description: 'The name of the contract to compile',
	},
	{
		displayName: 'Enable Optimization',
		name: 'optimization',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: [OPERATIONS.COMPILE_CONTRACT],
			},
		},
		default: true,
		description: 'Whether to enable compiler optimization',
	},
	{
		displayName: 'Solidity Version',
		name: 'version',
		type: 'string',
		displayOptions: {
			show: {
				operation: [OPERATIONS.COMPILE_CONTRACT],
			},
		},
		default: '0.8.20',
		description: 'The Solidity compiler version to use',
	},
];

// Get Standard ABI parameters
export const getStandardAbiProperties: INodeProperties[] = [
	{
		displayName: 'ABI Type',
		name: 'abiType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				operation: [OPERATIONS.GET_STANDARD_ABI],
			},
		},
		options: [
			{
				name: 'ERC20',
				value: STANDARD_ABIS.ERC20,
				description: 'Standard ERC20 token interface',
			},
			{
				name: 'ERC721',
				value: STANDARD_ABIS.ERC721,
				description: 'Standard ERC721 NFT interface',
			},
			{
				name: 'ERC1155',
				value: STANDARD_ABIS.ERC1155,
				description: 'Standard ERC1155 multi-token interface',
			},
		],
		default: 'ERC20',
		description: 'The type of standard ABI to get',
	},
];

export const nodeProperties: INodeProperties[] = [
	operationProperty,
	...tokenDetailsProperties,
	...tokenCreationProperties,
	...swapTokenProperties,
	...getAbiProperties,
	...createNFTProperties,
	...getCurrentPriceProperties,
	...sendPaymentProperties,
	...purchaseItemProperties,
	...earnYieldProperties,
	...compileContractProperties,
	...getStandardAbiProperties,
];
