<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
	type Props = { variant?: Variant; iconOnly?: boolean; children: Snippet } & (
		({ href: string } & HTMLAnchorAttributes) | ({ href?: undefined } & HTMLButtonAttributes)
	);

	/** A button, or a link styled as one when `href` is set. Icon-only buttons need `aria-label`. */
	let { variant = 'primary', iconOnly = false, children, ...rest }: Props = $props();
</script>

{#if rest.href !== undefined}
	<a class="button {variant}" class:icon-only={iconOnly} {...rest as HTMLAnchorAttributes}>
		{@render children()}
	</a>
{:else}
	<button
		type="button"
		class="button {variant}"
		class:icon-only={iconOnly}
		{...rest as HTMLButtonAttributes}
	>
		{@render children()}
	</button>
{/if}

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		min-height: var(--touch-target);
		min-width: var(--touch-target);
		padding: 0 var(--space-4);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		font-size: var(--font-size-body);
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}
	.icon-only {
		padding: 0;
	}
	.primary {
		background: var(--color-accent);
		color: var(--color-surface);
	}
	.primary:hover,
	.primary:active {
		background: var(--color-accent-hover);
	}
	.outline {
		background: var(--color-surface);
		border-color: var(--color-border-strong);
		color: var(--color-ink);
	}
	.outline:hover,
	.outline:active,
	.ghost:hover,
	.ghost:active {
		background: var(--color-surface-muted);
	}
	.ghost {
		background: transparent;
		color: var(--color-ink);
	}
	.danger {
		background: var(--color-surface);
		border-color: var(--color-border-strong);
		color: var(--color-danger);
	}
	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
