<script lang="ts">
	import type { DBInfo } from '@/models';
	import { Form, Input, Select } from '@kksh/svelte5';
	import SuperDebug, { defaults, superForm } from 'sveltekit-superforms';
	import { valibot, valibotClient } from 'sveltekit-superforms/adapters';
	import * as v from 'valibot';

	let {
		class: className,
		onSubmit
	}: {
		class: string;
		onSubmit: (data: Omit<DBInfo, 'id'>) => void;
	} = $props();

	const aiChoices = [{ value: 'openai', label: 'OpenAI' }];

	const npmPackageNameFormSchema = v.object({
		name: v.pipe(v.string(), v.minLength(1)),
		apiKey: v.pipe(v.string(), v.minLength(1)),
		ai: v.pipe(v.string(), v.minLength(1))
	});

	const form = superForm(defaults(valibot(npmPackageNameFormSchema)), {
		validators: valibotClient(npmPackageNameFormSchema),
		SPA: true,
		onUpdate({ form, cancel }) {
			if (!form.valid) {
				console.log('invalid');
				return;
			}
			onSubmit(form.data);
			cancel();
		}
	});
	const { form: formData, enhance, errors } = form;
	$formData.ai = 'openai'; // set default value
	const triggerContent = $derived(
		aiChoices.find((f) => f.value === $formData.ai)?.label ?? 'Select a AI'
	);
</script>

<form method="POST" use:enhance class={className}>
	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<div class="flex items-center gap-2">
					<Input {...props} bind:value={$formData.name} placeholder="Database Name" />
				</div>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="flex gap-2">
		<Form.Field {form} name="ai">
			<Form.Control>
				{#snippet children({ props })}
					<Select.Root type="single" name="favoriteFruit" bind:value={$formData.ai}>
						<Select.Trigger class="w-[180px]">
							{triggerContent}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.GroupHeading>AI Provider</Select.GroupHeading>
								{#each aiChoices as ai}
									<Select.Item value={ai.value} label={ai.label}>{ai.label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="apiKey" class="grow">
			<Form.Control>
				{#snippet children({ props })}
					<div class="flex items-center gap-2">
						<Input {...props} bind:value={$formData.apiKey} placeholder="OpenAI API Key" />
					</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>
	<Form.Button class="w-full">Add</Form.Button>
</form>
