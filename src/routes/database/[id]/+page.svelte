<script lang="ts">
	import { dialog, path, toast } from '@kksh/api/ui/custom';
	import { dbStore } from '@/stores/db';
	import { Button, Input, Popover } from '@kksh/svelte5';
	import { getRpcAPI } from '@/deno';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { InfoIcon, LoaderIcon } from 'lucide-svelte';
	import SvelteMarkdown from 'svelte-markdown';

	let { data } = $props();
	let query = $state('');
	let ans = $state('');
	let loading = $state(false);
	const selectedDb = $dbStore.find((db) => db.id === data.id);
	let rpc: Awaited<ReturnType<typeof getRpcAPI>> | undefined;

	onMount(async () => {
		if (!selectedDb) {
			toast.error('Database not found', { description: 'Name: ' + data.id });
			return goto('/');
		}
		rpc = await getRpcAPI({
			OPENAI_API_KEY: selectedDb.apiKey
		});
		rpc.command.stderr.on('data', (data) => {
			console.warn(data);
		});
		const extSupportDir = await path.extensionSupportDir();
		await rpc?.api.init(extSupportDir, selectedDb!.name);
	});

	onDestroy(async () => {
		await rpc?.process.kill();
	});

	async function indexFiles(files: string[]) {
		try {
			console.log('Start indexing files', files);

			await rpc?.api.indexFiles(files);
			await rpc?.api.save();
			console.log('Finished indexing files');
			toast.success('Finished indexing files');
		} catch (error) {
			console.error('Error indexing files', error);
			toast.error('Failed to index files');
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
	<h1 class="text-2xl font-bold">
		Manage Database
		<Popover.Root>
			<Popover.Trigger>
				<Button size="icon" variant="ghost">
					<InfoIcon />
				</Button>
			</Popover.Trigger>
			<Popover.Content>
				Pick the files or directories you want to index into vector database. Then you can use the
				database to answer questions.
			</Popover.Content>
		</Popover.Root>
	</h1>
	<div class="flex gap-2">
		<Button class="w-full" onclick={addFiles}>Add Files</Button>
		<Button class="w-full" onclick={addDirectory}>Add Directory</Button>
	</div>
	<form
		method="POST"
		use:enhance={async ({ formElement, formData, action, cancel, submitter }) => {
			cancel();
			ans = '';
			loading = true;
			if (query.length === 0) {
				toast.error('Question is required');
				return;
			}
			ans = (await rpc?.api.query(query)) ?? '';
			query = '';
			loading = false;
		}}
	>
		<div class="mt-4 flex gap-1">
			<Input name="query" type="text" bind:value={query} placeholder="Question" />
			<Button type="submit">Submit</Button>
		</div>
		{#if loading}
			<div class="flex h-64 items-center justify-center">
				<LoaderIcon class="animate-spin" />
			</div>
		{:else}
			<div class="container mt-4">
				<SvelteMarkdown source={ans} />
			</div>
		{/if}
	</form>
</div>
