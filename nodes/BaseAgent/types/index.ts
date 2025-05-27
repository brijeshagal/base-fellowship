import type { IDataObject } from 'n8n-workflow';

export interface TokenCreationParams {
	tokenName: string;
	tokenSymbol: string;
	decimals: number;
	initialSupply: number;
}

export interface SwapTokenParams {
	fromToken: string;
	toToken: string;
	amount: string;
	slippage: number;
}

export interface BaseApiCredentials {
	privateKey: string;
	rpcUrl: string;
	openAiApiKey: string;
}

export interface OperationResult extends IDataObject {
	success: boolean;
	data?: any;
	error?: string;
}
