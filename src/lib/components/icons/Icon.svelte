<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Base for stroke icons on a 24px grid. Decorative: label the surrounding control instead. */
	let { size = 24, children }: { size?: number; children: Snippet } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	focusable="false"
>
	{@render children()}
</svg>
