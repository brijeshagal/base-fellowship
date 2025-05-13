import { INodeProperties } from 'n8n-workflow';
import { OPERATIONS } from '../constants';

export const operationProperty: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    options: [
        {
            name: OPERATIONS.GET_TOKEN_DETAILS,
            value: OPERATIONS.GET_TOKEN_DETAILS,
            description: 'Get token contract address, decimals, and symbol from ticker',
        },
        {
            name: OPERATIONS.CREATE_TOKEN,
            value: OPERATIONS.CREATE_TOKEN,
            description: 'Deploy a new ERC20 token contract',
        },
        {
            name: OPERATIONS.SWAP_TOKEN,
            value: OPERATIONS.SWAP_TOKEN,
            description: 'Swap one token for another',
        },
    ],
    default: OPERATIONS.GET_TOKEN_DETAILS,
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
        type: 'string',
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
        type: 'string',
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
        required: false,
        default: 0.5,
        description: 'The maximum allowed slippage in percentage',
        displayOptions: {
            show: {
                operation: [OPERATIONS.SWAP_TOKEN],
            },
        },
    },
];

export const nodeProperties: INodeProperties[] = [
    operationProperty,
    ...tokenDetailsProperties,
    ...tokenCreationProperties,
    ...swapTokenProperties,
]; 