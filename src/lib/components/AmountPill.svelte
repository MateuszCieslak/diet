<script lang="ts">
	import { pl } from '$lib/i18n/pl';

	type Props = {
		/** Item name, for the accessible label. */
		name: string;
		/** The formatted amount with its unit; empty when the item has no amount yet. */
		text: string;
		onclick: () => void;
	};

	/** A shopping item's amount; tapping it opens the inline amount input. */
	let { name, text, onclick }: Props = $props();
</script>

{#if text}
	<button class="pill" aria-label={pl.shopping.editAmount(name)} {onclick}>{text}</button>
{:else}
	<button class="pill empty" aria-label={pl.shopping.addAmount(name)} {onclick}>
		{pl.shopping.addAmountPill}
	</button>
{/if}

<style>
	.pill {
		/* The pill stays 36px tall in the row; the hit area is padded out to 44px. */
		position: relative;
		min-width: 64px;
		height: 36px;
		margin-right: var(--space-2);
		padding: 0 10px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		color: var(--color-ink);
		font-size: var(--font-size-secondary);
		font-weight: 600;
		white-space: nowrap;
		cursor: pointer;
	}
	.pill::before {
		position: absolute;
		inset: -4px;
		content: '';
	}
	.empty {
		border-style: dashed;
		border-color: var(--color-border-strong);
		background: transparent;
		color: var(--color-muted);
	}
</style>
