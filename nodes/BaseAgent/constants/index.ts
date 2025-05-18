export const DEFAULT_CHAIN_ID = 8453;
export const DEFAULT_SLIPPAGE = 0.5;

export const OPERATIONS = {
    GET_TOKEN_DETAILS: 'getTokenDetails',
    CREATE_TOKEN: 'createToken',
    SWAP_TOKEN: 'swapToken',
    GET_ABI: 'getAbi',
    CREATE_NFT: 'createNFT',
    GET_CURRENT_PRICE: 'getCurrentPrice',
} as const;

export const OPERATION_DISPLAY_NAMES = {
    [OPERATIONS.GET_TOKEN_DETAILS]: 'Get Token Details',
    [OPERATIONS.CREATE_TOKEN]: 'Create Token',
    [OPERATIONS.SWAP_TOKEN]: 'Swap Token',
    [OPERATIONS.GET_ABI]: 'Get Contract ABI',
    [OPERATIONS.CREATE_NFT]: 'Create NFT Contract',
    [OPERATIONS.GET_CURRENT_PRICE]: 'Get Token Price',
} as const;

export const OPERATION_DESCRIPTIONS = {
    [OPERATIONS.GET_TOKEN_DETAILS]: 'Get token contract address, decimals, and symbol from ticker',
    [OPERATIONS.CREATE_TOKEN]: 'Deploy a new ERC20 token contract',
    [OPERATIONS.SWAP_TOKEN]: 'Swap one token for another',
    [OPERATIONS.GET_ABI]: 'Get the ABI for a contract address',
    [OPERATIONS.CREATE_NFT]: 'Deploy a new ERC721 NFT contract',
    [OPERATIONS.GET_CURRENT_PRICE]: 'Get the current price of a token',
} as const; 