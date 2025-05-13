export const DEFAULT_CHAIN_ID = 8453;
export const DEFAULT_SLIPPAGE = 0.5;

export const OPERATIONS = {
    EXTRACT_TICKER: 'extractTicker',
    CREATE_TOKEN: 'createToken',
    SWAP_TOKEN: 'swapToken',
} as const;

export const OPERATION_DISPLAY_NAMES = {
    [OPERATIONS.EXTRACT_TICKER]: 'Get Token Address',
    [OPERATIONS.CREATE_TOKEN]: 'Create Token',
    [OPERATIONS.SWAP_TOKEN]: 'Swap Token',
} as const;

export const OPERATION_DESCRIPTIONS = {
    [OPERATIONS.EXTRACT_TICKER]: 'Get token contract address and decimals from ticker symbol',
    [OPERATIONS.CREATE_TOKEN]: 'Deploy a new ERC20 token contract',
    [OPERATIONS.SWAP_TOKEN]: 'Swap one token for another',
} as const; 