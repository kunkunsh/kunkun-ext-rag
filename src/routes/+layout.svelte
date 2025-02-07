<script>
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { ThemeWrapper, updateTheme } from '@kksh/svelte5';
	import { onMount } from 'svelte';
	import { ui } from '@kksh/api/ui/custom';
	import { Sidebar } from '@kksh/svelte5';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { DB_DATATYPE_DATABASE } from '@/constants';
	import { dbStore } from '@/stores/db';

	let { children } = $props();

	onMount(() => {
		ui.registerDragRegion();
		ui.getTheme().then((theme) => {
			updateTheme(theme);
		});
		dbStore.load();
	});
</script>

<ModeWatcher />
<ThemeWrapper>
	<Sidebar.Provider>
		<AppSidebar />
		<main class="w-full">
			<Sidebar.Trigger />
			{@render children?.()}
		</main>
	</Sidebar.Provider>
</ThemeWrapper>
