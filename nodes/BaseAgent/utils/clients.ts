import { Address, createPublicClient, createWalletClient, http, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as allViemChains from 'viem/chains';

export const viemChainsById: Record<number, allViemChains.Chain> = Object.values(
	allViemChains,
).reduce((acc, chainData) => {
	return chainData.id
		? {
				...acc,
				[chainData.id]: chainData,
			}
		: acc;
}, {});

export const getPublicClient = (chainId: number) => {
	return createPublicClient({
		transport: http(),
		chain: viemChainsById[chainId],
	});
};

export const getWalletClient = (chainId: number): WalletClient => {
	const account = privateKeyToAccount(process.env.PRIV_KEY as Address);
	return createWalletClient({
		transport: http(),
		account,
		chain: viemChainsById[chainId],
	});
};
