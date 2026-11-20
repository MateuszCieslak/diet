<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import MealPicker from '$lib/components/MealPicker.svelte';
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { MealTypeKey } from '$lib/config/meal-types';
	import { pl } from '$lib/i18n/pl';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** Keeps `?q=&type=` in the URL, so going back from a meal restores the filter. */
	function syncUrl(filter: { q: string; type?: MealTypeKey }) {
		const url = new URL(page.url);
		url.search = '';
		if (filter.q) url.searchParams.set('q', filter.q);
		if (filter.type) url.searchParams.set('type', filter.type);
		replaceState(url, page.state);
	}
</script>

<svelte:head>
	<title>{pl.meals.title} · {pl.appName}</title>
</svelte:head>

<header class="header">
	<h1>{pl.meals.title}</h1>
	<Button href="/meals/new">
		<PlusIcon size={20} />
		{pl.common.new}
	</Button>
</header>

<div class="content">
	<!-- A new server load (e.g. the "Posiłki" tab) starts the picker over. -->
	{#key data.page}
		<MealPicker
			initial={{ q: data.q, type: data.type, page: data.page }}
			onFilterChange={syncUrl}
		/>
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
