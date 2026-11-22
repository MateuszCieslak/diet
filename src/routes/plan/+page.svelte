<script lang="ts">
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { deserialize, enhance } from '$app/forms';
	import MealPicker from '$lib/components/MealPicker.svelte';
	import NutritionTable from '$lib/components/NutritionTable.svelte';
	import PlanMealCard from '$lib/components/PlanMealCard.svelte';
	import WeekBar from '$lib/components/WeekBar.svelte';
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { users } from '$lib/config/users';
	import { pl } from '$lib/i18n/pl';
	import { dayEatenKcal, dayTotals } from '$lib/nutrition';
	import type { PlanMeal } from '$lib/plan';
	import type { MealListItem } from '$lib/schemas/meal';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const dayMeals = $derived(data.meals.filter((m) => m.date === data.date));
	const plannedDates = $derived(new Set(data.meals.map((m) => m.date)));
	const totals = $derived(dayTotals(dayMeals, users));
	const eatenKcal = $derived(dayEatenKcal(dayMeals, users));

	const dayFormat = new Intl.DateTimeFormat('pl-PL', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		timeZone: 'UTC'
	});
	const dayLabel = $derived.by(() => {
		const text = dayFormat.format(new Date(`${data.date}T00:00:00Z`));
		return text.charAt(0).toUpperCase() + text.slice(1);
	});

	/** The picker adds to the selected day, or replaces `replacing` when it is set. */
	let pickerOpen = $state(false);
	let replacing = $state<PlanMeal | null>(null);
	let pickedMealId = $state<number | null>(null);
	let pickForm = $state<HTMLFormElement>();

	function openPicker(meal: PlanMeal | null) {
		replacing = meal;
		pickerOpen = true;
	}

	const flipDurationMs = 150;

	/** The last order the server confirmed; `items` is what the list shows while dragging. */
	let order = $derived(dayMeals);
	let items = $derived(order);
	let reordering = $state(false);
	let reorderError = $state<string | null>(null);

	function consider(event: CustomEvent<DndEvent<PlanMeal>>) {
		items = event.detail.items;
	}

	async function finalize(event: CustomEvent<DndEvent<PlanMeal>>) {
		items = event.detail.items;
		const ids = items.map((m) => m.id);
		if (ids.every((id, i) => id === order[i]?.id)) return;

		reordering = true;
		reorderError = null;
		const body = new FormData();
		body.set('date', data.date);
		body.set('ids', JSON.stringify(ids));
		try {
			const response = await fetch('?/reorder', {
				method: 'POST',
				body,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await response.text());
			if (result.type !== 'success') throw new Error(`Reorder failed: ${result.type}`);
			// No invalidation: the list already shows the new order.
			order = items;
		} catch {
			items = order;
			reorderError = pl.planEdit.reorderFailed;
		} finally {
			reordering = false;
		}
	}

	async function pick(meal: MealListItem) {
		pickedMealId = meal.id;
		pickerOpen = false;
		await tick();
		pickForm?.requestSubmit();
	}
</script>

<svelte:head>
	<title>{pl.plan.title} · {pl.appName}</title>
</svelte:head>

<WeekBar date={data.date} today={data.today} week={data.week} {plannedDates} />

<div class="content stack">
	<h2 class="day-title">{dayLabel}</h2>

	{#if form?.error}
		<p class="error" role="alert">{form.error}</p>
	{/if}
	{#if reorderError}
		<p class="error" role="alert">{reorderError}</p>
	{/if}

	{#if dayMeals.length > 0}
		<section class="card summary">
			<h3 class="section-label">{pl.plan.daySummary}</h3>
			<NutritionTable perUser={totals} {eatenKcal} />
		</section>

		<!-- The library's built-in screen reader texts are English, so they are turned off. -->
		<section
			class="stack"
			aria-label={pl.plan.meals}
			use:dragHandleZone={{
				items,
				flipDurationMs,
				dragDisabled: reordering,
				dropTargetStyle: {},
				autoAriaDisabled: true
			}}
			onconsider={consider}
			onfinalize={finalize}
		>
			{#each items as meal (meal.id)}
				<div class="item" animate:flip={{ duration: flipDurationMs }}>
					<PlanMealCard
						{meal}
						types={meal.sourceMealId === null ? [] : (data.types[meal.sourceMealId] ?? [])}
						onReplace={() => openPicker(meal)}
					/>
				</div>
			{/each}
		</section>
	{:else}
		<p class="muted empty">{pl.plan.empty}</p>
	{/if}

	<button
		type="button"
		class="add"
		class:large={dayMeals.length === 0}
		onclick={() => openPicker(null)}
	>
		<PlusIcon size={20} />
		{pl.plan.addMeal}
	</button>
</div>

<Dialog
	bind:open={pickerOpen}
	title={replacing ? pl.plan.replaceMeal : pl.plan.addMeal}
	subtitle={dayLabel}
>
	<!-- The dialog keeps its children while closed, so mount the picker only when it is open. -->
	{#if pickerOpen}
		<MealPicker onPick={pick} />
	{/if}
</Dialog>

<form
	bind:this={pickForm}
	method="POST"
	action={replacing ? '?/replace' : '?/add'}
	use:enhance
	hidden
>
	<input type="hidden" name="mealId" value={pickedMealId ?? ''} />
	{#if replacing}
		<input type="hidden" name="planMealId" value={replacing.id} />
	{:else}
		<input type="hidden" name="date" value={data.date} />
	{/if}
</form>

<style>
	.content {
		gap: var(--space-4);
		padding: var(--space-2) var(--gutter) var(--space-6);
	}
	.day-title {
		margin: 0;
		font-size: var(--font-size-subtitle);
		font-weight: 700;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}
	.empty {
		margin: 0;
		text-align: center;
	}
	.error {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--font-size-secondary);
	}
	.item {
		border-radius: var(--radius-lg);
	}
	.item:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
	.add {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		min-height: 56px;
		border: 1.5px dashed var(--color-accent-soft-border);
		border-radius: var(--radius-lg);
		background: var(--color-accent-soft);
		color: var(--color-accent);
		font-size: var(--font-size-body);
		font-weight: 600;
		cursor: pointer;
	}
	.add.large {
		min-height: 120px;
	}
	.add:hover {
		border-color: var(--color-accent);
	}
	.add:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
