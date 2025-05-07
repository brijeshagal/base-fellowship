import dotenv from 'dotenv';
import Moralis from 'moralis';
import { toHex } from 'viem';
dotenv.config();

let isMoralisInitialized = false;

export async function getTokenFromTicker(symbol: string) {
	try {
		if (!isMoralisInitialized) {
			await Moralis.start({
				apiKey: process.env.MORALIS_API_KEY,
			});
			isMoralisInitialized = true;
		}

		const response = await Moralis.EvmApi.token.getTokenMetadataBySymbol({
			symbols: [symbol],
			chain: toHex(8453),
		});

		console.log(response.raw[0]);
		if (response.raw[0]) {
			return response.raw[0] as any;
		}
	} catch (e) {
		console.error(e);
		return {};
	}
}

/**
 *   address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  address_label: null,
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: '6',
  logo: 'https://logo.moralis.io/0x2105_0x833589fcd6edb6e08f4c7c32d4f71b54bda02913_08900d18ed100f2bad6fc53388a71159.png',
  logo_hash: null,
  thumbnail: 'https://logo.moralis.io/0x2105_0x833589fcd6edb6e08f4c7c32d4f71b54bda02913_08900d18ed100f2bad6fc53388a71159.png',
  total_supply: '3751828177779174',
  total_supply_formatted: '3751828177.779174',
  fully_diluted_valuation: '3743974553.31',
  block_number: '2797221',
  validated: 1,
  created_at: '2023-08-18T18:36:29.000Z',
  possible_spam: false,
  verified_contract: true,
  categories: [],
  links: {
    moralis: 'https://moralis.com/chain/base/token/price/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
  },
  security_score: null,
  description: null,
  circulating_supply: '3751828177.779174',
  market_cap: '3743974553.31'
}
 */
