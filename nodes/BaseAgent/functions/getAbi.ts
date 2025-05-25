import axios from 'axios';
import { getPublicClient } from '../utils/clients';

export async function getAbi(
	contractAddress: string,
	chainId: number,
	baseScanApiKey?: string,
): Promise<any> {
	try {
		if (baseScanApiKey) {
			// Use BaseScan API if key is provided
			const url = `https://api.basescan.org/api?module=contract&action=getabi&address=${contractAddress}&apikey=${baseScanApiKey}`;
			const response = await axios.get(url);
			const data = response.data;

			if (data.status === '0') {
				throw new Error(data.message || 'Failed to fetch ABI from BaseScan');
			}

			const abi = JSON.parse(data.result);
			return {
				success: true,
				data: {
					address: contractAddress,
					abi: abi,
				},
			};
		} else {
			// Fallback to getting bytecode if no API key
			const publicClient = getPublicClient(chainId);
			const bytecode = await publicClient.getBytecode({
				address: contractAddress as `0x${string}`,
			});

			if (!bytecode) {
				throw new Error('Contract not found or no bytecode available');
			}

			return {
				success: true,
				data: {
					address: contractAddress,
					bytecode: bytecode,
					note: 'No BaseScan API key provided. Only bytecode is available.',
				},
			};
		}
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}
