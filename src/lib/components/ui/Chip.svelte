<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	/** A pill toggle. Controlled: the parent owns `pressed` and updates it in `onclick`. */
	let {
		pressed = false,
		children,
		...rest
	}: { pressed?: boolean; children: Snippet } & HTMLButtonAttributes = $props();
</script>

<button type="button" class="chip" aria-pressed={pressed} {...rest}>
	{@render children()}
</button>

<style>
	.chip {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		min-height: var(--touch-target);
		padding: 0 var(--space-4);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-pill);
		background: var(--color-surface);
		color: var(--color-ink);
		font-size: var(--font-size-secondary);
		font-weight: 600;
		white-space: nowrap;
		cursor: pointer;
	}
	.chip[aria-pressed='true'] {
		border-color: var(--color-accent);
		background: var(--color-accent);
		color: var(--color-surface);
	}
	.chip:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
