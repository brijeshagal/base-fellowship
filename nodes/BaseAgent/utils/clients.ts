import dotenv from 'dotenv';
import { Account, createPublicClient, createWalletClient, Hex, http, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as allViemChains from 'viem/chains';

dotenv.config();

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

export const getWalletClient = (
	chainId: number,
	privKey: Hex,
): { account: Account; walletClient: WalletClient } => {
	const account = privateKeyToAccount(privKey);
	return {
		account,
		walletClient: createWalletClient({
			transport: http(process.env.ALCHEMY_BASE_API),
			account,
			chain: viemChainsById[chainId],
		}),
	};
};
