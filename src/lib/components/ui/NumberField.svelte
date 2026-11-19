<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { Unit } from '$lib/config/units';
	import { pl } from '$lib/i18n/pl';

	type Props = {
		name: string;
		label: string;
		value?: string;
		unit?: Unit;
		error?: string;
	} & Omit<HTMLInputAttributes, 'name' | 'value' | 'type' | 'inputmode'>;

	/**
	 * A decimal number input. Kept as text with `inputmode="decimal"` so a Polish comma (`1,5`)
	 * reaches the server as typed; `decimalInput` parses it.
	 */
	let { name, label, value = $bindable(''), unit, error, ...rest }: Props = $props();
	const id = $props.id();
</script>

<div class="field">
	<label for={id}>{label}</label>
	<div class="control">
		<input
			{id}
			{name}
			type="text"
			inputmode="decimal"
			autocomplete="off"
			bind:value
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? `${id}-error` : undefined}
			{...rest}
		/>
		{#if unit}
			<span class="unit">{pl.units[unit]}</span>
		{/if}
	</div>
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
	.control {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	input {
		flex: 1;
		min-width: 0;
		min-height: var(--touch-target);
		padding: 0 var(--space-3);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-ink);
		text-align: right;
	}
	input:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
	}
	input[aria-invalid='true'] {
		border-color: var(--color-danger);
	}
	.unit {
		min-width: 2.5em;
		color: var(--color-muted);
		font-size: var(--font-size-secondary);
	}
	.error {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--font-size-secondary);
	}
</style>
