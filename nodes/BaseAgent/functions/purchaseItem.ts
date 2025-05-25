import type { Hex } from 'viem';
import { createWalletClient, http, parseEther } from 'viem';
import { base } from 'viem/chains';

interface PurchaseItemParams {
	itemId: string;
	amount: string;
	tokenAddress?: string; // Optional: if not provided, uses native token
	marketplaceAddress: string;
}

export async function purchaseItem(params: PurchaseItemParams, chainId: number, privateKey: Hex) {
	// const publicClient = createPublicClient({
	//     chain: base,
	//     transport: http(),
	// });

	const walletClient = createWalletClient({
		account: privateKey,
		chain: base,
		transport: http(),
	});

	const { itemId, amount, tokenAddress, marketplaceAddress } = params;

	// Basic marketplace ABI for purchasing items
	const abi = [
		{
			name: 'purchaseItem',
			type: 'function',
			stateMutability: 'payable',
			inputs: [
				{ name: 'itemId', type: 'uint256' },
				{ name: 'tokenAddress', type: 'address' },
			],
			outputs: [{ name: '', type: 'bool' }],
		},
	];

	const hash = await walletClient.writeContract({
		address: marketplaceAddress as Hex,
		abi,
		functionName: 'purchaseItem',
		args: [itemId, tokenAddress || '0x0000000000000000000000000000000000000000'],
		value: tokenAddress ? BigInt(0) : parseEther(amount),
	});

	return {
		transactionHash: hash,
		status: 'pending',
		itemId,
		marketplaceAddress,
	};
}
