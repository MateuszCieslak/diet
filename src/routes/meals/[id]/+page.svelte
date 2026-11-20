<script lang="ts">
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeftIcon.svelte';
	import PencilIcon from '$lib/components/icons/PencilIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { pl } from '$lib/i18n/pl';
	import { formatAmount, formatKcal, formatMacro, mealNutrition } from '$lib/nutrition';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const meal = $derived(data.meal);

	// The standard portion only; per-person amounts are shown for meals in the plan.
	const nutrition = $derived(mealNutrition(meal.items));
</script>

<svelte:head>
	<title>{meal.name} · {pl.appName}</title>
</svelte:head>

<header class="header">
	<Button href="/meals" variant="ghost" iconOnly aria-label={pl.common.back}>
		<ArrowLeftIcon />
	</Button>
	<h1>{meal.name}</h1>
	<Button href="/meals/{meal.id}/edit" variant="outline" iconOnly aria-label={pl.meals.edit}>
		<PencilIcon size={20} />
	</Button>
</header>

<div class="content stack">
	{#if meal.photo}
		<img class="photo" src="/photos/{meal.photo}" alt={pl.meals.photoAlt(meal.name)} />
	{/if}

	<ul class="types" aria-label={pl.meals.types}>
		{#each meal.types as type (type)}
			<li>{pl.mealTypes[type]}</li>
		{/each}
	</ul>

	<section class="card">
		<h2 class="section-label">{pl.meals.ingredients}</h2>
		<table class="amounts">
			<thead>
				<tr>
					<th scope="col">{pl.meals.ingredient}</th>
					<th scope="col" class="amount">{pl.meals.amount}</th>
				</tr>
			</thead>
			<tbody>
				{#each meal.items as item, i (i)}
					<tr>
						<th scope="row">{item.ingredient.name}</th>
						<td class="amount">
							{formatAmount(item.amount, item.ingredient.unit)}
							{pl.units[item.ingredient.unit]}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section class="card">
		<h2 class="section-label">{pl.meals.nutrition}</h2>
		<table class="amounts nutrition">
			<thead>
				<tr>
					<th scope="col"><span class="visually-hidden">{pl.meals.standardPortion}</span></th>
					<th scope="col" class="amount">{pl.nutrition.kcal}</th>
					<th scope="col" class="amount">
						<abbr title={pl.nutrition.protein}>{pl.nutrition.proteinShort}</abbr>
					</th>
					<th scope="col" class="amount">
						<abbr title={pl.nutrition.fat}>{pl.nutrition.fatShort}</abbr>
					</th>
					<th scope="col" class="amount">
						<abbr title={pl.nutrition.carbs}>{pl.nutrition.carbsShort}</abbr>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th scope="row">{pl.meals.standardPortion}</th>
					<td class="amount kcal">{formatKcal(nutrition.kcal)}</td>
					<td class="amount">{formatMacro(nutrition.protein)}</td>
					<td class="amount">{formatMacro(nutrition.fat)}</td>
					<td class="amount">{formatMacro(nutrition.carbs)}</td>
				</tr>
			</tbody>
		</table>
	</section>

	{#if meal.preparation}
		<section class="card">
			<h2 class="section-label">{pl.meals.preparation}</h2>
			<p class="preparation">{meal.preparation}</p>
		</section>
	{/if}
</div>

<style>
	.header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--gutter);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}
	h1 {
		flex: 1;
		min-width: 0;
		margin: 0;
		font-size: var(--font-size-subtitle);
		font-weight: 700;
		overflow-wrap: anywhere;
	}
	.content {
		gap: var(--space-4);
		padding: var(--space-4) var(--gutter);
	}
	.photo {
		width: 100%;
		max-height: 280px;
		border-radius: var(--radius-lg);
		object-fit: cover;
	}
	.types {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.types li {
		padding: 2px var(--space-3);
		border-radius: var(--radius-pill);
		background: var(--color-surface-muted);
		color: var(--color-muted);
		font-size: var(--font-size-secondary);
		font-weight: 600;
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
	.amounts {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-secondary);
	}
	.amounts th,
	.amounts td {
		padding: var(--space-2);
		text-align: left;
	}
	.amounts thead th {
		font-size: var(--font-size-label);
		font-weight: 700;
	}
	.amounts thead th:first-child {
		color: var(--color-muted);
	}
	.amounts tbody tr + tr {
		border-top: 1px solid var(--color-divider);
	}
	.amounts tbody th {
		font-weight: 600;
	}
	.amounts .amount {
		text-align: right;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.nutrition abbr {
		text-decoration: none;
	}
	.nutrition .kcal {
		font-weight: 700;
	}
	.preparation {
		margin: 0;
		font-size: var(--font-size-body);
		line-height: 1.6;
		white-space: pre-line;
	}
</style>
