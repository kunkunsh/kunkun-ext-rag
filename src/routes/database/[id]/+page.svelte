<script lang="ts">
	import { dialog, path } from '@kksh/api/ui/iframe';
	import { dbStore } from '@/stores/db';
	import { Button } from '@kksh/svelte5';
	import { getRpcAPI } from '@/deno';
	import { goto } from '$app/navigation';
	import { toast } from '@kksh/api/headless';
	let { data } = $props();

	const selectedDb = $dbStore.find((db) => db.id === data.id);
	if (!selectedDb) {
		toast.error('Database not found', { description: 'Name: ' + data.id });
		goto('/');
	}
	let rpc: Awaited<ReturnType<typeof getRpcAPI>> | undefined;

	async function indexFiles(files: string[]) {
		if (!selectedDb) {
			toast.error('Database not found', { description: 'Name: ' + data.id });
			return goto('/');
		}
		try {
			const extSupportDir = await path.extensionSupportDir();
			rpc = await getRpcAPI({
				OPENAI_API_KEY: selectedDb.apiKey,
				EXTENSION_SUPPORT: extSupportDir
			});
			rpc.command.stderr.on('data', (data) => {
				console.warn(data);
			});
			console.log('Start indexing files');
			await rpc.api.indexFiles(selectedDb!.name, files);
			console.log('Finished indexing files');
		} catch (error) {
			console.error('Error indexing files', error);
			toast.error('Failed to index files');
		} finally {
			setTimeout(async () => {
				await rpc?.process.kill();
			}, 2_000);
		}
	}

	async function addFiles() {
		dialog
			.open({
				multiple: true,
				directory: false
			})
			.then(async (res: string[]) => {
				await indexFiles(res);
			});
	}

	function addDirectory() {
		dialog
			.open({
				multiple: true,
				directory: true
			})
			.then(async (res: string[]) => {
				await indexFiles(res);
			});
	}
</script>

<div class="container">
	<h1 class="text-2xl font-bold">Manage Database</h1>
	<Button onclick={addFiles}>Add Files</Button>
	<Button onclick={addDirectory}>Add Directory</Button>
</div>
