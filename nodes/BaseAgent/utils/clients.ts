import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

export const getPublicClient = () => {
	return createPublicClient({
		transport: http(),
		chain: baseSepolia,
	});
};
