import { zeroAddress } from 'viem';
import { getTokenFromTicker } from '../moralis';

export interface TokenDetails {
    address: string;
    decimals: number;
    symbol: string;
}

export async function getTokenDetails(ticker: string): Promise<TokenDetails> {
    try {
        // Handle native ETH token
        if (ticker.toLowerCase() === 'eth') {
            return {
                address: zeroAddress,
                decimals: 18, // ETH has 18 decimals
                symbol: 'ETH',
            };
        }

        // For other tokens, use Moralis
        const tokenInfo = await getTokenFromTicker(ticker);
        return {
            address: tokenInfo.address,
            decimals: tokenInfo.decimals,
            symbol: ticker.toUpperCase(),
        };
    } catch (error) {
        throw new Error(`Failed to get token details for ${ticker}: ${error.message}`);
    }
} 