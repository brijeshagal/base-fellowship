import axios from 'axios';

export async function getCurrentPrice(tokenSymbol: string): Promise<any> {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenSymbol.toLowerCase()}&vs_currencies=usd`
    );

    const price = response.data[tokenSymbol.toLowerCase()]?.usd;
    if (!price) throw new Error(`Price not found for ${tokenSymbol}`);

    return {
      success: true,
      data: {
        symbol: tokenSymbol,
        price: price.toString(),
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
