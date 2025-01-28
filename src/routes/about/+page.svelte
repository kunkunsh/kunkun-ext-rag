<script>
	import { base } from '$app/paths';
	import TauriLink from '@/components/TauriLink.svelte';
	import { Alert, Button, ThemeWrapper } from '@kksh/svelte5';
</script>

<div class="prose container">
	<h1 class="text-3xl font-bold">About Page</h1>
	<strong>Source Code:</strong>
	<TauriLink href="https://github.com/kunkunsh/kunkun-ext-rag">
		https://github.com/kunkunsh/kunkun-ext-rag
	</TauriLink>.
	<br />
	<br />
	<p>
		Kunkun RAG Extension is a local RAG app, that allows you to index a local directory of files and
		search them using a LLM model.
	</p>
	<p>
		If you don't know what RAG is, you can read more about it
		<TauriLink href="https://en.wikipedia.org/wiki/Retrieval-augmented_generation">
			https://en.wikipedia.org/wiki/Retrieval-augmented_generation
		</TauriLink>.
	</p>
	<p>You can add files to a database. Currently only text files are supported.</p>
	<p>
		Text Files with extension <code>.txt</code>, <code>.md</code>, <code>.mdx</code> are supported. If
		you need other file types, send a feature request to the repo.
	</p>
</div>
