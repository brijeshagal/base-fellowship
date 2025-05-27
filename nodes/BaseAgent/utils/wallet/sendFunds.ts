import dotenv from 'dotenv';
import { createWalletClient, http, parseEther } from 'viem';
import { type Address, privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

import { getPublicClient } from '../clients';

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
		address: acc.address,
		value,
		to: agentAddress as Address,
	});
	const res = await getPublicClient(84532).waitForTransactionReceipt({ hash });
	console.log('Txn hash: ', hash);
	if (res.status === 'success') {
		return hash;
	}
	return undefined;
}
