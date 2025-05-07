import {
	ActionProvider,
	erc20ActionProvider,
	pythActionProvider,
	walletActionProvider,
	wethActionProvider,
} from '@coinbase/agentkit';

// export const erc721 = erc721ActionProvider();
// export const pyth = pythActionProvider();
// export const wallet = walletActionProvider(); // default action package: get balance, native transfer, and get wallet details
// export const cdp = cdpApiActionProvider({
// 	// for providers that require API keys include them in their instantiation
// 	apiKeyName: process.env.CDP_API_KEY_NAME,
// 	apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, '\n'),
// });

export const actionProviders: ActionProvider[] = [
	wethActionProvider(),
	pythActionProvider(),
	walletActionProvider(),
	erc20ActionProvider(),
];

export {};
