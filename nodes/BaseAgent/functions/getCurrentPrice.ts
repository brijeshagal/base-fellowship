import axios from 'axios';
import dotenv from 'dotenv';
import { ApplicationError } from 'n8n-workflow';
import { isAddress, zeroAddress } from 'viem';

import { getTokenDetails } from './getTokenDetails';

dotenv.config();

export async function getCurrentPriceByAddress(
	contractAddress: string,
	chain: string = 'base', // default to Base chain
	apiKey = process.env.COINGECKO_API_KEY, // optional CoinGecko API key
): Promise<any> {
	try {
		let normalizedAddress = "";
		if (isAddress(contractAddress)) {
			normalizedAddress = contractAddress.toLowerCase();
		} else {
			const tokenDetails = await getTokenDetails(contractAddress);
			if (tokenDetails && typeof tokenDetails === 'object' && 'address' in tokenDetails) {
				normalizedAddress = tokenDetails.address as string;
			} else {
				// throw new Error(`Token not found for contract address: ${contractAddress}`);
				throw new ApplicationError(`Token not found for contract address: ${contractAddress}`);
			}
		}

		const headers: Record<string, string> = {
			accept: 'application/json',
		};

		if (apiKey) {
			headers['x-cg-demo-api-key'] = apiKey;
		}

		let url: string;
		if (normalizedAddress === zeroAddress) {
			// For ETH (zero address), use the simple price endpoint
			url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
		} else {
			// For ERC20 tokens, use the token price endpoint
			url = `https://api.coingecko.com/api/v3/simple/token_price/${chain}?contract_addresses=${normalizedAddress}&vs_currencies=usd`;
		}

		const response = await axios.get(url, { headers });

		console.log(response.data)

		let price;
		if (normalizedAddress === '0x0000000000000000000000000000000000000000') {
			price = response.data?.ethereum?.usd;
		} else {
			price = response.data?.[normalizedAddress]?.usd;
		}

		if (price === undefined) {
			throw new ApplicationError(`Price not found for contract address: ${contractAddress}`);
		}

		return {
			success: true,
			data: {
				address: contractAddress,
				price: price.toString(),
				lastUpdated: new Date().toISOString(),
			},
		};
	} catch (error: any) {
		return {
			success: false,
			error: error.message,
		};
	}
}
