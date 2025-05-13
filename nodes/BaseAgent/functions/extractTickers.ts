import { zeroAddress } from 'viem';
import { getTokenFromTicker } from '../moralis';

export async function extractTickers(ticker: string): Promise<{ address: string; decimals: number }> {
    try {
        // Handle native ETH token
        if (ticker.toLowerCase() === 'eth') {
            return {
                address: zeroAddress,
                decimals: 18, // ETH has 18 decimals
            };
        }

        // For other tokens, use Moralis
        const tokenInfo = await getTokenFromTicker(ticker);
        return {
            address: tokenInfo.address,
            decimals: tokenInfo.decimals,
        };
    } catch (error) {
        throw new Error(`Failed to get token info for ticker ${ticker}: ${error.message}`);
    }
} 