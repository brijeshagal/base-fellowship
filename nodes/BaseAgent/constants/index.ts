export const DEFAULT_CHAIN_ID = 8453;
export const DEFAULT_SLIPPAGE = 0.5;

export const OPERATIONS = {
	GET_TOKEN_DETAILS: 'getTokenDetails',
	CREATE_TOKEN: 'createToken',
	SWAP_TOKEN: 'swapToken',
	GET_ABI: 'getAbi',
	CREATE_NFT: 'createNFT',
	GET_CURRENT_PRICE: 'getCurrentPrice',
	SEND_PAYMENT: 'sendPayment',
	PURCHASE_ITEM: 'purchaseItem',
	EARN_YIELD: 'earnYield',
	COMPILE_CONTRACT: 'compileContract',
	GET_STANDARD_ABI: 'getStandardAbi',
} as const;

export const OPERATION_DISPLAY_NAMES = {
	[OPERATIONS.GET_TOKEN_DETAILS]: 'Get Token Details',
	[OPERATIONS.CREATE_TOKEN]: 'Create Token',
	[OPERATIONS.SWAP_TOKEN]: 'Swap Token',
	[OPERATIONS.GET_ABI]: 'Get Contract ABI',
	[OPERATIONS.CREATE_NFT]: 'Create NFT Contract',
	[OPERATIONS.GET_CURRENT_PRICE]: 'Get Token Price',
	[OPERATIONS.SEND_PAYMENT]: 'Send Payment',
	[OPERATIONS.PURCHASE_ITEM]: 'Purchase Item',
	[OPERATIONS.EARN_YIELD]: 'Earn Yield',
	[OPERATIONS.COMPILE_CONTRACT]: 'Compile Solidity Contract',
	[OPERATIONS.GET_STANDARD_ABI]: 'Get Standard ABI',
} as const;

export const OPERATION_DESCRIPTIONS = {
	[OPERATIONS.GET_TOKEN_DETAILS]: 'Get token contract address, decimals, and symbol from ticker',
	[OPERATIONS.CREATE_TOKEN]: 'Deploy a new ERC20 token contract',
	[OPERATIONS.SWAP_TOKEN]: 'Swap one token for another',
	[OPERATIONS.GET_ABI]: 'Get the ABI for a contract address',
	[OPERATIONS.CREATE_NFT]: 'Deploy a new ERC721 NFT contract',
	[OPERATIONS.GET_CURRENT_PRICE]: 'Get the current price of a token',
	[OPERATIONS.SEND_PAYMENT]: 'Send cryptocurrency to another address',
	[OPERATIONS.PURCHASE_ITEM]: 'Purchase items using cryptocurrency',
	[OPERATIONS.EARN_YIELD]: 'Stake tokens to earn yield',
	[OPERATIONS.COMPILE_CONTRACT]: 'Compile Solidity code to bytecode and ABI',
	[OPERATIONS.GET_STANDARD_ABI]: 'Get standard contract ABIs (ERC20, ERC721, etc.)',
} as const;
