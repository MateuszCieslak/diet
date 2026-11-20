<script lang="ts">
	import IngredientForm from '$lib/components/IngredientForm.svelte';
	import { pl } from '$lib/i18n/pl';
	import type { IngredientFormValues } from '$lib/schemas/ingredient';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const empty: IngredientFormValues = {
		name: '',
		unit: 'g',
		category: '',
		kcal: '',
		protein: '',
		fat: '',
		carbs: ''
	};
</script>

<svelte:head>
	<title>{pl.ingredients.newTitle} · {pl.appName}</title>
</svelte:head>

<IngredientForm
	title={pl.ingredients.newTitle}
	values={form?.values ?? empty}
	errors={form?.errors}
/>
