<script lang="ts">
	import { enhance } from '$app/forms';
	import MealForm from '$lib/components/MealForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { pl } from '$lib/i18n/pl';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let confirmOpen = $state(false);
</script>

<svelte:head>
	<title>{pl.meals.editTitle} · {pl.appName}</title>
</svelte:head>

<MealForm
	mode="meal"
	title={pl.meals.editTitle}
	backHref="/meals/{data.meal.id}"
	action="?/update"
	initial={data.meal}
	errors={form?.errors}
/>

<div class="delete">
	<Button variant="danger" onclick={() => (confirmOpen = true)}>{pl.meals.delete}</Button>
</div>

<Dialog bind:open={confirmOpen} title={pl.meals.deleteTitle} subtitle={data.meal.name}>
	<form method="POST" action="?/delete" use:enhance class="stack">
		<p class="note">{pl.meals.deleteNote}</p>
		<div class="actions">
			<Button variant="outline" onclick={() => (confirmOpen = false)}>{pl.common.cancel}</Button>
			<Button type="submit" variant="danger">{pl.meals.deleteConfirm}</Button>
		</div>
	</form>
</Dialog>

<style>
	.delete {
		display: flex;
		padding: var(--space-2) var(--gutter) var(--space-6);
	}
	.delete :global(.button) {
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
