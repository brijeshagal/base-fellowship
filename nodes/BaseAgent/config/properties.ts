import { INodeProperties } from 'n8n-workflow';
import { OPERATIONS, OPERATION_DISPLAY_NAMES, OPERATION_DESCRIPTIONS, DEFAULT_SLIPPAGE } from '../constants';

export const operationProperty: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    options: Object.entries(OPERATION_DISPLAY_NAMES).map(([value, name]) => ({
        name,
        value,
        description: OPERATION_DESCRIPTIONS[value as keyof typeof OPERATION_DESCRIPTIONS],
        action: name,
    })),
    default: OPERATIONS.EXTRACT_TICKER,
};

export const tokenCreationProperties: INodeProperties[] = [
    {
        displayName: 'Token Name',
        name: 'tokenName',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                operation: [OPERATIONS.CREATE_TOKEN],
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
                operation: [OPERATIONS.CREATE_TOKEN],
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
                operation: [OPERATIONS.CREATE_TOKEN],
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
                operation: [OPERATIONS.CREATE_TOKEN],
            },
        },
        default: 1000000,
        description: 'Initial supply of tokens to mint',
    },
];

export const swapTokenProperties: INodeProperties[] = [
    {
        displayName: 'From Token',
        name: 'fromToken',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                operation: [OPERATIONS.SWAP_TOKEN],
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
                operation: [OPERATIONS.SWAP_TOKEN],
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
                operation: [OPERATIONS.SWAP_TOKEN],
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
                operation: [OPERATIONS.SWAP_TOKEN],
            },
        },
        default: DEFAULT_SLIPPAGE,
        description: 'Maximum acceptable slippage percentage',
    },
];

export const extractTickerProperties: INodeProperties[] = [
    {
        displayName: 'Ticker Symbol',
        name: 'ticker',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                operation: [OPERATIONS.EXTRACT_TICKER],
            },
        },
        default: '',
        description: 'Token ticker symbol to get address for (e.g., USDC, DAI)',
    },
];

export const nodeProperties: INodeProperties[] = [
    operationProperty,
    ...tokenCreationProperties,
    ...swapTokenProperties,
    ...extractTickerProperties,
]; 