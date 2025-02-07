<script lang="ts">
	import { open } from '@kksh/api/ui/custom';

	let { href, children } = $props();
</script>

<a
	class="text-blue-500 hover:underline"
	{href}
	onclick={(e) => {
		e.preventDefault();
		open.url(href);
	}}
>
	{@render children()}
</a>
