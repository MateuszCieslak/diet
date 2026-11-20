<script lang="ts">
	import MealForm from '$lib/components/MealForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { mealTypes, type MealTypeKey } from '$lib/config/meal-types';
	import { pl } from '$lib/i18n/pl';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let recipeOpen = $state(false);
	let types = $state<MealTypeKey[]>([]);

	const saved = $derived(form && 'saved' in form ? form.saved : null);
	const errors = $derived(form && 'errors' in form ? form.errors : undefined);

	function toggleType(type: MealTypeKey) {
		types = types.includes(type) ? types.filter((t) => t !== type) : [...types, type];
	}
</script>

<svelte:head>
	<title>{pl.planEdit.title} · {pl.appName}</title>
</svelte:head>

<MealForm
	mode="planMeal"
	title={pl.planEdit.title}
	backHref="/plan?date={data.planMeal.date}"
	action="?/save"
	initial={data.planMeal}
	{errors}
>
	<p class="muted note">{pl.planEdit.note}</p>

	{#if saved}
		<p class="saved" role="status">
			{pl.planEdit.recipeSaved(saved.name)}
			<a href="/meals/{saved.id}">{pl.planEdit.openRecipe}</a>
		</p>
	{/if}

	{#if form && 'recipe' in form}
		<p class="error" role="alert">{pl.planEdit.recipeFailed}</p>
	{/if}

	<Button variant="outline" onclick={() => (recipeOpen = true)}>{pl.planEdit.saveAsRecipe}</Button>

	<!-- Inside the form, so the chosen types and the submit button belong to it. -->
	<Dialog
		bind:open={recipeOpen}
		title={pl.planEdit.saveAsRecipeTitle}
		subtitle={pl.planEdit.saveAsRecipeNote}
	>
		<fieldset class="stack">
			<legend class="label">{pl.meals.types}</legend>
			<div class="chips">
				{#each mealTypes as type (type)}
					<Chip pressed={types.includes(type)} onclick={() => toggleType(type)}>
						{pl.mealTypes[type]}
					</Chip>
				{/each}
			</div>
			{#each types as type (type)}
				<input type="hidden" name="types" value={type} />
			{/each}
			{#if errors?.types}
				<p class="error">{errors.types}</p>
			{/if}
			<Button
				type="submit"
				formaction="?/saveAsRecipe"
				disabled={types.length === 0}
				onclick={() => (recipeOpen = false)}
			>
				{pl.planEdit.saveAsRecipeConfirm}
			</Button>
		</fieldset>
	</Dialog>
</MealForm>

<style>
	.note {
		margin: 0;
		font-size: var(--font-size-secondary);
	}
	.saved {
		margin: 0;
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--color-accent-soft);
	}
	.saved a {
		color: var(--color-accent);
		font-weight: 600;
	}
	fieldset {
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		border: none;
	}
	.label {
		padding: 0;
		margin-bottom: var(--space-2);
		color: var(--color-muted);
		font-size: var(--font-size-secondary);
		font-weight: 600;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.error {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--font-size-secondary);
	}
</style>
