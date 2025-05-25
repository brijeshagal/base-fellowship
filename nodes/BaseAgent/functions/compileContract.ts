import { exec } from 'child_process';
import * as fs from 'fs';
import { ApplicationError } from 'n8n-workflow';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CompileContractParams {
	sourceCode: string;
	contractName: string;
	optimization?: boolean;
	version?: string;
}

interface CompilationResult {
	bytecode: string;
	abi: any[];
	metadata?: any;
}

async function ensureSolcInstalled(version: string): Promise<void> {
	try {
		await execAsync('solc --version');
	} catch (error) {
		console.log('Installing solc...');
		try {
			await execAsync(`npm install -g solc@${version}`);
		} catch (installError) {
			throw new ApplicationError('Failed to install solc', {
				level: 'error',
				cause: installError instanceof Error ? installError.message : String(installError),
			});
		}
	}
}

export async function compileContract(params: CompileContractParams): Promise<CompilationResult> {
	const { sourceCode, contractName, optimization = true, version = '0.8.20' } = params;

	// Create a temporary directory for compilation
	const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'solc-'));
	const sourcePath = path.join(tempDir, `${contractName}.sol`);

	try {
		// Write the source code to a temporary file
		await fs.promises.writeFile(sourcePath, sourceCode);

		// Ensure solc is installed
		await ensureSolcInstalled(version);

		// Prepare solc command
		const optimizationFlag = optimization ? '--optimize' : '';
		const command = `solc ${sourcePath} --bin --abi --metadata ${optimizationFlag} --evm-version paris`;

		// Compile the contract
		const { stdout, stderr } = await execAsync(command);

		if (stderr) {
			throw new ApplicationError('Compilation error', {
				level: 'error',
				cause: stderr,
			});
		}

		// Parse the output
		const output = stdout.toString();
		const bytecodeMatch = output.match(/Binary:\n(.*?)(?=\n\n)/s);
		const abiMatch = output.match(/Contract JSON ABI\n(.*?)(?=\n\n)/s);
		const metadataMatch = output.match(/Metadata:\n(.*?)(?=\n\n)/s);

		if (!bytecodeMatch || !abiMatch) {
			throw new ApplicationError('Failed to extract bytecode or ABI from compilation output', {
				level: 'error',
				cause: output,
			});
		}

		const bytecode = bytecodeMatch[1].trim();
		const abi = JSON.parse(abiMatch[1].trim());
		const metadata = metadataMatch ? JSON.parse(metadataMatch[1].trim()) : undefined;

		return {
			bytecode: `0x${bytecode}`,
			abi,
			metadata,
		};
	} catch (error) {
		if (error instanceof ApplicationError) {
			throw error;
		}
		throw new ApplicationError('Contract compilation failed', {
			level: 'error',
			cause: error instanceof Error ? error.message : String(error),
		});
	} finally {
		// Clean up temporary files
		try {
			await fs.promises.rmdir(tempDir, { recursive: true });
		} catch (error) {
			console.error('Failed to clean up temporary files:', error);
		}
	}
}
