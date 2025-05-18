import { erc721Abi, Hex } from 'viem';
import { base } from 'viem/chains';
import { getPublicClient, getWalletClient } from '../utils/clients';

export interface NFTCreationParams {
    name: string;
    symbol: string;
    baseURI?: string;
}

export async function createNFT(
    params: NFTCreationParams,
    chainId: number,
    privateKey: Hex
): Promise<any> {
    try {
        const { account, walletClient } = getWalletClient(chainId, privateKey);
        const publicClient = getPublicClient(chainId);

        // Deploy the NFT contract
        const hash = await walletClient.deployContract({
            account,
            abi: erc721Abi,
            bytecode: '0x',
            args: [params.name, params.symbol],
            chain: base
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status !== 'success') {
            throw new Error('NFT contract deployment failed');
        }

        return {
            success: true,
            data: {
                contractAddress: receipt.contractAddress,
                transactionHash: hash,
                name: params.name,
                symbol: params.symbol
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
} 