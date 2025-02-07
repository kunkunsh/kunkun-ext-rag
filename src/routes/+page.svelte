<script lang="ts">
	import { db, ui, kv, toast } from '@kksh/api/ui/custom';
	import AddBucket from '$lib/components/forms/AddBucket.svelte';
	import type { DBInfo } from '@/models';
	import { onMount } from 'svelte';
	import { DB_DATATYPE_DATABASE } from '@/constants';
	import { dbStore } from '@/stores/db';
	import DatabaseList from '@/components/DatabaseList.svelte';

	async function onSubmit(data: Omit<DBInfo, 'id'>) {
		dbStore
			.add(data)
			.then(() => {
				toast.success('Database added');
				return dbStore.load();
			})
			.catch((err) => {
				toast.error('Fail to add database to extension storage', { description: err.message });
			});
	}
</script>

<div class="container mx-auto">
	<AddBucket class="w-full" {onSubmit} />
	<br />
	<h1 class="text-2xl font-bold">Databases</h1>
	<DatabaseList />
</div>
