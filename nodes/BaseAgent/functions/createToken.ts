import { erc20Abi, Hex } from 'viem';
import { getPublicClient, getWalletClient, viemChainsById } from '../utils/clients';

export interface TokenCreationParams {
	tokenName: string;
	tokenSymbol: string;
	decimals: number;
	initialSupply: number;
}

export async function createToken(
	params: TokenCreationParams,
	chainId: number,
	privKey: Hex,
): Promise<any> {
	const { account, walletClient } = getWalletClient(chainId, privKey);
	const publicClient = getPublicClient(chainId);

	const bytecode = await publicClient.getCode({
		address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
	});

	const hash = await walletClient.deployContract({
		abi: erc20Abi,
		account,
		args: [params.tokenName, params.tokenSymbol, params.decimals, params.initialSupply],
		chain: viemChainsById[chainId],
		bytecode: bytecode as Hex,
	});

	const txnReceipt = await publicClient.waitForTransactionReceipt({ hash });
	if (txnReceipt.status !== 'success') {
		throw new Error('Token creation failed');
	}

	return txnReceipt;
}
