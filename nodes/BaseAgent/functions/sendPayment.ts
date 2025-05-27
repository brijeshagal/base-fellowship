import { ChainId } from '@lifi/sdk';
import type { Hex } from 'viem';
import { erc20Abi, parseEther, zeroAddress } from 'viem';

import { getPublicClient, getWalletClient, viemChainsById } from '../utils/clients';

interface SendPaymentParams {
	to: string;
	amount: string;
	tokenAddress?: string;
}

export async function sendPayment(params: SendPaymentParams, privateKey: Hex) {
	const publicClient = getPublicClient(ChainId.BAS);

	const { account, walletClient } = getWalletClient(ChainId.BAS, privateKey)

	const { to, amount, tokenAddress } = params;

	if (tokenAddress && tokenAddress !== zeroAddress) {
		const hash = await walletClient.writeContract({
			address: tokenAddress as Hex,
			abi: erc20Abi,
			functionName: 'transfer',
			args: [to as Hex, parseEther(amount)],
			chain: viemChainsById[ChainId.BAS],
			account
		});

		const receipt = await publicClient.waitForTransactionReceipt({
			hash,
		});

		return {
			receipt,
			type: 'ERC20',
		};
	} else {
		// Send native token
		const hash = await walletClient.sendTransaction({
			to: to as Hex,
			value: parseEther(amount),
			chain: viemChainsById[ChainId.BAS],
			account
		});

		const receipt = await publicClient.waitForTransactionReceipt({
			hash,
		});

		return {
			receipt,
			type: 'native',
		};
	}
}
