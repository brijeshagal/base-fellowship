import { viem } from '@goat-sdk/wallet-viem';
import { ChainId, getQuote } from '@lifi/sdk';
import {
	Address,
	erc20Abi,
	formatUnits,
	Hash,
	Hex,
	maxUint256,
	parseUnits,
	zeroAddress,
} from 'viem';
import { getTokenFromTicker } from '../moralis';
import { getPublicClient, getWalletClient, viemChainsById } from '../utils/clients';

export interface SwapTokenParams {
	fromToken: string;
	toToken: string;
	amount: string;
	slippage: number;
}

export async function swapToken(
	params: SwapTokenParams,
	chainId: number,
	privKey: Hex,
): Promise<any> {
	const { account, walletClient } = getWalletClient(chainId, privKey);
	const publicClient = getPublicClient(chainId);
	const wallet = viem(walletClient);

	const inputToken =
		params.fromToken.toLowerCase() === 'eth'
			? { address: zeroAddress, decimals: 18 }
			: await getTokenFromTicker(params.fromToken);

	const outputToken =
		params.toToken.toLowerCase() === 'eth'
			? { address: zeroAddress, decimals: 18 }
			: await getTokenFromTicker(params.toToken);

	const quote = await getQuote({
		fromAddress: wallet.getAddress(),
		fromChain: ChainId.BAS,
		toChain: ChainId.BAS,
		fromToken: inputToken.address,
		toToken: outputToken.address,
		fromAmount: parseUnits(params.amount, inputToken.decimals).toString(),
	});

	if (inputToken.address !== zeroAddress) {
		await handleTokenApproval(inputToken.address, account, walletClient, publicClient, quote);
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
		throw new Error('Token swap failed');
	}

	const receivedAmount = await publicClient.readContract({
		abi: erc20Abi,
		functionName: 'balanceOf',
		address: outputToken.address,
		args: [account.address],
	});

	return {
		txnReceipt,
		receivedAmount: formatUnits(receivedAmount, outputToken.decimals),
	};
}

async function handleTokenApproval(
	tokenAddress: Address,
	account: any,
	walletClient: any,
	publicClient: any,
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
			throw new Error('Token approval failed');
		}
	}
}
