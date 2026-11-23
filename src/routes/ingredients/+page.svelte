<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import IngredientList from '$lib/components/IngredientList.svelte';
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { pl } from '$lib/i18n/pl';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** Keeps `?q=` in the URL, so going back from an ingredient restores the search. */
	function syncUrl(filter: { q: string }) {
		const url = new URL(page.url);
		url.search = '';
		if (filter.q) url.searchParams.set('q', filter.q);
		replaceState(url, page.state);
	}
</script>

<svelte:head>
	<title>{pl.ingredients.title} · {pl.appName}</title>
</svelte:head>

<header class="header">
	<h1>{pl.ingredients.title}</h1>
	<Button href="/ingredients/new">
		<PlusIcon size={20} />
		{pl.common.new}
	</Button>
</header>

<div class="content">
	<!-- A new server load (e.g. the "Składniki" tab) starts the list over. -->
	{#key data.page}
		<IngredientList initial={{ q: data.q, page: data.page }} onFilterChange={syncUrl} />
	{/key}
</div>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-4) var(--gutter) var(--space-2);
	}
	h1 {
		margin: 0;
		font-size: var(--font-size-title);
		font-weight: 700;
	}
	.content {
		padding: var(--space-2) var(--gutter) var(--space-4);
	}
</style>
