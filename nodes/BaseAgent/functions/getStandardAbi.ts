import { ApplicationError } from 'n8n-workflow';
import { erc20Abi, erc721Abi, erc1155Abi, type Abi } from 'viem';

export const STANDARD_ABIS = {
	ERC20: 'erc20',
	ERC721: 'erc721',
	ERC1155: 'erc1155',
} as const;

export type StandardAbiType = (typeof STANDARD_ABIS)[keyof typeof STANDARD_ABIS];

interface GetStandardAbiParams {
	abiType: StandardAbiType;
}

export async function getStandardAbi(params: GetStandardAbiParams): Promise<{ abi: Abi }> {
	const { abiType } = params;

	try {
		let abi;
		switch (abiType.toLowerCase()) {
			case STANDARD_ABIS.ERC20:
				abi = erc20Abi;
				break;
			case STANDARD_ABIS.ERC721:
				abi = erc721Abi;
				break;
			case STANDARD_ABIS.ERC1155:
				abi = erc1155Abi;
				break;
			default:
				throw new ApplicationError('Unsupported ABI type', {
					level: 'error',
					cause: `ABI type ${abiType} is not supported`,
				});
		}

		return { abi };
	} catch (error) {
		if (error instanceof ApplicationError) {
			throw error;
		}
		throw new ApplicationError('Failed to get standard ABI', {
			level: 'error',
			cause: error instanceof Error ? error.message : String(error),
		});
	}
}
