<script lang="ts">
	import { ui } from '@kksh/api/ui/iframe';
	import { Sidebar } from '@kksh/svelte5';
	import { DatabaseIcon, InfoIcon } from 'lucide-svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		ui.showBackButton('bottom-right');
	});

	const items = [
		{
			title: 'Database',
			url: '/',
			icon: DatabaseIcon
		},
		{
			title: 'About',
			url: '/about',
			icon: InfoIcon
		}
	];
</script>

<Sidebar.Root>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel data-kunkun-drag-region>Menu</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each items as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href={item.url} {...props}>
										<!-- <Icon icon={item.icon} /> -->
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>
