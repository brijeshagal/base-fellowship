import type { Hex } from 'viem';
import { createWalletClient, http, parseEther } from 'viem';
import { base } from 'viem/chains';

interface EarnYieldParams {
	tokenAddress: string;
	amount: string;
	stakingPoolAddress: string;
}

export async function earnYield(params: EarnYieldParams, chainId: number, privateKey: Hex) {
	// const publicClient = createPublicClient({
	//     chain: base,
	//     transport: http(),
	// });

	const walletClient = createWalletClient({
		account: privateKey,
		chain: base,
		transport: http(),
	});

	const { tokenAddress, amount, stakingPoolAddress } = params;

	// First approve the staking pool to spend tokens
	const tokenAbi = [
		{
			name: 'approve',
			type: 'function',
			stateMutability: 'nonpayable',
			inputs: [
				{ name: 'spender', type: 'address' },
				{ name: 'amount', type: 'uint256' },
			],
			outputs: [{ name: '', type: 'bool' }],
		},
	];

	await walletClient.writeContract({
		address: tokenAddress as Hex,
		abi: tokenAbi,
		functionName: 'approve',
		args: [stakingPoolAddress as Hex, parseEther(amount)],
	});

	// Then stake the tokens
	const stakingAbi = [
		{
			name: 'stake',
			type: 'function',
			stateMutability: 'nonpayable',
			inputs: [{ name: 'amount', type: 'uint256' }],
			outputs: [{ name: '', type: 'bool' }],
		},
	];

	const hash = await walletClient.writeContract({
		address: stakingPoolAddress as Hex,
		abi: stakingAbi,
		functionName: 'stake',
		args: [parseEther(amount)],
	});

	return {
		transactionHash: hash,
		status: 'pending',
		tokenAddress,
		stakingPoolAddress,
		amount,
	};
}
