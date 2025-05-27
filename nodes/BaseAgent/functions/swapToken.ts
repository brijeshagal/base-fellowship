import { ChainId, getQuote } from '@lifi/sdk';
import type { Account, Address, Hash, Hex, PublicClient, WalletClient } from 'viem';
import { erc20Abi, formatUnits, maxUint256, parseUnits, zeroAddress } from 'viem';

import { getPublicClient, getWalletClient, viemChainsById } from '../utils/clients';
import { getTokenDetails } from './getTokenDetails';

export interface SwapTokenParams {
	fromToken: string;
	toToken: string;
	amount: string;
	slippage: number;
}

async function handleTokenApproval(
	tokenAddress: Address,
	account: Account,
	walletClient: WalletClient,
	publicClient: PublicClient,
	quote: any,
): Promise<void> {
	const approvedAmt = await publicClient.readContract({
		abi: erc20Abi,
		functionName: 'allowance',
		address: tokenAddress,
		args: [account.address, quote.estimate.approvalAddress as Address],
	});

	if (approvedAmt < BigInt(quote.estimate.fromAmount)) {
		const approvalHash = await walletClient.writeContract({
			account,
			chain: viemChainsById[ChainId.BAS],
			address: tokenAddress,
			args: [quote.estimate.approvalAddress as Address, maxUint256],
			functionName: 'approve',
			abi: erc20Abi,
		});

		const approvalRes = await publicClient.waitForTransactionReceipt({
			hash: approvalHash,
		});

		if (approvalRes.status !== 'success') {
			// throw new Error('Token approval failed');
			return;
		}
	}
}

export async function swapToken(
	params: SwapTokenParams,
	chainId: number,
	privKey: Hex,
): Promise<any> {
	const { account, walletClient } = getWalletClient(chainId, privKey);
	const publicClient = getPublicClient(chainId);

	const inputToken = await getTokenDetails(params.fromToken);
	const outputToken = await getTokenDetails(params.toToken);

	let currOutputTokenBalance = BigInt(0);

	if (outputToken.address === zeroAddress) {
		currOutputTokenBalance = await publicClient.getBalance({ address: account.address });
	} else {
		currOutputTokenBalance = await publicClient.readContract({
			abi: erc20Abi,
			functionName: 'balanceOf',
			address: outputToken.address as Address,
			args: [account.address],
		});
	}

	const quote = await getQuote({
		fromAddress: walletClient.account?.address as Address,
		fromChain: ChainId.BAS,
		toChain: ChainId.BAS,
		fromToken: inputToken.address,
		toToken: outputToken.address,
		fromAmount: parseUnits(params.amount, inputToken.decimals).toString(),
	});

	if (inputToken.address !== zeroAddress) {
		await handleTokenApproval(inputToken.address as Address, account, walletClient, publicClient, quote);
	}

	const hash = await walletClient.sendTransaction({
		account,
		chain: viemChainsById[ChainId.BAS],
		data: quote.transactionRequest?.data as Hash,
		value: inputToken.address === zeroAddress ? BigInt(quote.estimate.fromAmount) : undefined,
		to: quote.estimate.approvalAddress as Address,
	});

	const txnReceipt = await publicClient.waitForTransactionReceipt({ hash });
	if (txnReceipt.status !== 'success') {
		// throw new Error('Token swap failed');
		return;
	}

	let latestOutputTokenBalance = BigInt(0);
	if (outputToken.address === zeroAddress) {
		latestOutputTokenBalance = await publicClient.getBalance({ address: account.address });
	} else {
		latestOutputTokenBalance = (await publicClient.readContract({
			abi: erc20Abi,
			functionName: 'balanceOf',
			address: outputToken.address as Address,
			args: [account.address],
		}));
	}

	const receivedAmount = formatUnits(latestOutputTokenBalance - currOutputTokenBalance, outputToken.decimals);

	return {
		txnReceipt,
		receivedAmount
	};
}
