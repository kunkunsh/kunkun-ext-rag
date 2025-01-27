<script lang="ts">
	import { DBInfo } from '@/models';
	import { dbStore } from '@/stores/db';
	import { toast } from '@kksh/api/headless';
	import { Button, Card } from '@kksh/svelte5';
</script>

{#snippet dbInfoCard(dbInfo: DBInfo)}
	<Card.Root>
		<Card.Header>
			<Card.Title>{dbInfo.name}</Card.Title>
			<Card.Description><strong>AI Provider:</strong> {dbInfo.ai}</Card.Description>
		</Card.Header>
		<Card.Content>
			<Button
				variant="destructive"
				size="lg"
				onclick={() =>
					dbStore
						.deleteById(dbInfo.id)
						.then(() => dbStore.load())
						.then(() => toast.success('Database deleted'))
						.catch((err) => toast.error('Fail to delete database', { description: err.message }))}
			>
				Delete
			</Button>
		</Card.Content>
	</Card.Root>
{/snippet}

<ul>
	{#each $dbStore as db}
		{@render dbInfoCard(db)}
	{/each}
</ul>
