import { fs, shell, path, toast } from '@kksh/api/ui/custom';
import type { DenoAPI } from '../api.types.ts';

export async function getRpcAPI(env: { OPENAI_API_KEY: string }) {
	await installDenoDeps().catch((err) => {
		return toast.error(`Failed to install deno dependencies; ${err.message}`);
	});
	const cwd = await path.join(await path.extensionDir(), 'deno-src');
	console.log('cwd', cwd);
	const { rpcChannel, process, command } = await shell.createDenoRpcChannel<object, DenoAPI>(
		'$EXTENSION/deno-src/index.ts',
		[],
		{
			cwd,
			// allowAllEnv: true,
			allowEnv: ['OPENAI_API_KEY', 'CWD'],
			allowWrite: ['$EXTENSION_SUPPORT'],
			allowAllRead: true,
			// allowAllWrite: true,
			allowAllFfi: true, // /Users/hk/Dev/kunkun-extension-repos/kunkun-ext-rag/deno-src/node_modules/.deno/faiss-node@0.5.1/node_modules/faiss-node/build/Release/faiss-node.node
			// allowAllSys: true, // uid
			allowSys: ['uid'],
			allowNet: ['api.openai.com'],
			env
		},
		{}
	);
	const api = rpcChannel.getAPI();
	return {
		api,
		rpcChannel,
		process,
		command
	};
}

export async function installDenoDeps() {
	const cwd = await path.join(await path.extensionDir(), 'deno-src');
	const nodeModulesPath = await path.join(cwd, 'node_modules');
	console.log('nodeModulesPath', nodeModulesPath);
	console.log('await fs.exists(nodeModulesPath)', await fs.exists(nodeModulesPath));

	if (await fs.exists(nodeModulesPath)) {
		console.log('Node modules already installed');
		return;
	}

	const command = shell.createCommand(
		'deno',
		['install', '--allow-scripts=npm:faiss-node@0.5.1,npm:sharp@0.33.5'],
		{ cwd }
	);
	const ret = await command.execute();
	if (ret.code !== 0) {
		// log.error(`Failed to install deno dependencies; ${ret.stderr}`);
		console.error(`Failed to install deno dependencies; ${ret.stderr}`);
		throw new Error('Failed to install deno dependencies', { cause: ret.stderr });
	}
}
