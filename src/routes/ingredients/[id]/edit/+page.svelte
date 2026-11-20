<script lang="ts">
	import { enhance } from '$app/forms';
	import IngredientForm from '$lib/components/IngredientForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { pl } from '$lib/i18n/pl';
	import { ingredientFormValues } from '$lib/schemas/ingredient';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let confirmOpen = $state(false);
</script>

<svelte:head>
	<title>{pl.ingredients.editTitle} · {pl.appName}</title>
</svelte:head>

<IngredientForm
	title={pl.ingredients.editTitle}
	action="?/update"
	values={form?.values ?? ingredientFormValues(data.ingredient)}
	errors={form?.errors}
	lockedUnit={data.ingredient.unit}
/>

<div class="hide">
	<Button variant="danger" onclick={() => (confirmOpen = true)}>{pl.ingredients.hide}</Button>
</div>

<Dialog bind:open={confirmOpen} title={pl.ingredients.hideTitle} subtitle={data.ingredient.name}>
	<form method="POST" action="?/hide" use:enhance class="stack">
		<p class="note">{pl.ingredients.hideNote}</p>
		<div class="actions">
			<Button variant="outline" onclick={() => (confirmOpen = false)}>{pl.common.cancel}</Button>
			<Button type="submit" variant="danger">{pl.ingredients.hideConfirm}</Button>
		</div>
	</form>
</Dialog>

<style>
	.hide {
		display: flex;
		padding: var(--space-2) var(--gutter) var(--space-6);
	}
	.hide :global(.button) {
		flex: 1;
	}
	.note {
		margin: 0;
	}
	.actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
	}
</style>
