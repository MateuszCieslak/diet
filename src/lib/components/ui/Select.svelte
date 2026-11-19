<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	type Option = { value: string; label: string };
	type Props = {
		name: string;
		label: string;
		options: readonly Option[];
		value?: string;
		placeholder?: string;
		error?: string;
	} & Omit<HTMLSelectAttributes, 'name' | 'value'>;

	let {
		name,
		label,
		options,
		value = $bindable(''),
		placeholder,
		error,
		...rest
	}: Props = $props();
	const id = $props.id();
</script>

<div class="field">
	<label for={id}>{label}</label>
	<select
		{id}
		{name}
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? `${id}-error` : undefined}
		{...rest}
	>
		{#if placeholder !== undefined}
			<option value="" disabled>{placeholder}</option>
		{/if}
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	{#if error}
		<p class="error" id="{id}-error">{error}</p>
	{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	label {
		color: var(--color-muted);
		font-size: var(--font-size-secondary);
		font-weight: 600;
	}
	select {
		min-height: var(--touch-target);
		padding: 0 var(--space-3);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-ink);
	}
	select:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
	}
	select[aria-invalid='true'] {
		border-color: var(--color-danger);
	}
	.error {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--font-size-secondary);
	}
</style>
