<script lang="ts">
	import type { Snippet } from 'svelte';
	import XIcon from '$lib/components/icons/XIcon.svelte';
	import { pl } from '$lib/i18n/pl';

	type Props = {
		open?: boolean;
		title: string;
		subtitle?: string;
		/**
		 * Fixed at 3/4 of the screen instead of fitting its content, so a sheet whose content changes
		 * while typing (a search) stays put and its top stays above the phone keyboard.
		 */
		tall?: boolean;
		onclose?: () => void;
		children: Snippet;
	};

	/**
	 * A modal on the native `<dialog>` element: a bottom sheet on phones, centered on wide screens.
	 * Escape, the close button and a tap on the backdrop all close it.
	 */
	let {
		open = $bindable(false),
		title,
		subtitle,
		tall = false,
		onclose,
		children
	}: Props = $props();
	let dialog: HTMLDialogElement;
	const titleId = $props.id();

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});

	function handleClose() {
		open = false;
		onclose?.();
	}

	function handleClick(event: MouseEvent) {
		if (event.target === dialog) dialog.close();
	}
</script>

<dialog
	bind:this={dialog}
	class:tall
	aria-labelledby={titleId}
	onclose={handleClose}
	onclick={handleClick}
>
	<header>
		<div>
			<h2 id={titleId}>{title}</h2>
			{#if subtitle}
				<p class="muted">{subtitle}</p>
			{/if}
		</div>
		<button type="button" class="close" aria-label={pl.common.close} onclick={() => dialog.close()}>
			<XIcon />
		</button>
	</header>
	<div class="body">
		{@render children()}
	</div>
</dialog>

<style>
	dialog {
		width: 100%;
		max-width: var(--content-max-width);
		max-height: 90dvh;
		margin: auto auto 0;
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		background: var(--color-surface);
		color: var(--color-ink);
	}
	dialog[open] {
		display: flex;
		flex-direction: column;
	}
	/* svh: the keyboard and the browser bars never resize it, so the sheet does not jump. */
	dialog.tall {
		height: 75svh;
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 0.35);
	}
	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-4) var(--gutter) var(--space-2);
	}
	h2 {
		margin: 0;
		font-size: var(--font-size-subtitle);
	}
	header p {
		margin: 0;
		font-size: var(--font-size-secondary);
	}
	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--touch-target);
		height: var(--touch-target);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-ink);
		cursor: pointer;
	}
	.body {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-2) var(--gutter) var(--space-4);
	}
	@media (min-width: 600px) {
		dialog {
			margin: auto;
			border-radius: var(--radius-lg);
		}
	}
</style>
