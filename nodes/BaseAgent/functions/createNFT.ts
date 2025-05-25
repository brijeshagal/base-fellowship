import { erc721Abi, type Hex } from 'viem';
import { base } from 'viem/chains';

import { getPublicClient, getWalletClient } from '../utils/clients';

export interface NFTCreationParams {
	name: string;
	symbol: string;
	baseURI?: string;
}

const erc721Bytecode =
	'0x608060405234801561001057600080fd5b5060405161010038038061010083398101604081905261002f91610037565b600080fd5b61004b8161003d565b82525050565b60006020820190506100666000830184610042565b92915050565b6000819050919050565b61007e8161006b565b811461008957600080fd5b50565b60008135905061009b81610075565b92915050565b6000602082840312156100b7576100b6610066565b5b60006100c58482850161008c565b9150509291505056fea2646970667358221220b1e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e64736f6c634300080a0033';

export async function createNFT(
	params: NFTCreationParams,
	chainId: number,
	privateKey: Hex,
): Promise<any> {
	try {
		const { account, walletClient } = getWalletClient(chainId, privateKey);
		const publicClient = getPublicClient(chainId);

		// Deploy the NFT contract
		const hash = await walletClient.deployContract({
			account,
			abi: erc721Abi,
			bytecode: erc721Bytecode, // Replace with actual bytecode for production
			args: [params.name, params.symbol],
			chain: base,
		});

		const receipt = await publicClient.waitForTransactionReceipt({ hash });

		if (receipt.status !== 'success') {
			return {
				success: false,
				error: 'NFT contract deployment failed',
			};
		}

		return {
			success: true,
			data: {
				contractAddress: receipt.contractAddress,
				transactionHash: hash,
				name: params.name,
				symbol: params.symbol,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}
