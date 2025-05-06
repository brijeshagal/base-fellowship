import dotenv from 'dotenv';
import { createWalletClient, http, parseEther } from 'viem';
import { Address, privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

dotenv.config();

export async function sendFundsToAgent(agentAddress: string) {
	const acc = privateKeyToAccount(process.env.PRIV_KEY as Address);
	const walletClient = createWalletClient({
		account: acc,
		transport: http('https://base-sepolia.gateway.tenderly.co'),
		chain: baseSepolia,
	});
	const value = parseEther('0.001');
	console.log({ value });
	const hash = await walletClient.sendTransaction({
		address: acc.address as Address,
		value,
		to: agentAddress as Address,
	});
	console.log('Txn hash: ', hash);
	return hash;
}
