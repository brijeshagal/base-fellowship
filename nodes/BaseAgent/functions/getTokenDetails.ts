import { ApplicationError } from 'n8n-workflow';
import { Address, erc20Abi, isAddress, zeroAddress } from 'viem';

import { DEFAULT_CHAIN_ID } from '../constants';
import { getTokenFromTicker } from '../moralis';
import { getPublicClient } from '../utils/clients';

export interface TokenDetails {
	address: string;
	decimals: number;
	symbol: string;
}

export async function getTokenDetails(ticker: string): Promise<TokenDetails> {
	try {
		// Handle native ETH token
		if (ticker.toLowerCase() === 'eth' || ticker === zeroAddress) {
			return {
				address: zeroAddress,
				decimals: 18, // ETH has 18 decimals
				symbol: 'ETH',
			};
		}

		if (isAddress(ticker)) {
			const publicClient = getPublicClient(DEFAULT_CHAIN_ID);
			const decimals = await publicClient.readContract({
				abi: erc20Abi,
				functionName: 'decimals',
				address: ticker as Address,
			});
			const symbol = await publicClient.readContract({
				abi: erc20Abi,
				functionName: 'symbol',
				address: ticker as Address,
			});
			return {
				address: ticker,
				decimals,
				symbol,
			};
		}


		// For other tokens, use Moralis
		const tokenInfo = await getTokenFromTicker(ticker.toUpperCase());
		return {
			address: tokenInfo.address,
			decimals: tokenInfo.decimals,
			symbol: ticker.toUpperCase(),
		};
	} catch (error) {
		throw new ApplicationError(`Failed to get token details for ${ticker}: ${error.message}`);
	}
}
