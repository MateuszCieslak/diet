<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		name: string;
		label: string;
		value?: string;
		error?: string;
	} & Omit<HTMLInputAttributes, 'name' | 'value'>;

	let { name, label, value = $bindable(''), error, type = 'text', ...rest }: Props = $props();
	const id = $props.id();
</script>

<div class="field">
	<label for={id}>{label}</label>
	<input
		{id}
		{name}
		{type}
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? `${id}-error` : undefined}
		{...rest}
	/>
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
	input {
		min-height: var(--touch-target);
		padding: 0 var(--space-3);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-ink);
	}
	input:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
	}
	input[aria-invalid='true'] {
		border-color: var(--color-danger);
	}
	.error {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--font-size-secondary);
	}
</style>
