<script lang="ts">
	import MealForm from '$lib/components/MealForm.svelte';
	import { pl } from '$lib/i18n/pl';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>{pl.meals.newTitle} · {pl.appName}</title>
</svelte:head>

<MealForm mode="meal" title={pl.meals.newTitle} backHref="/meals" errors={form?.errors} />
