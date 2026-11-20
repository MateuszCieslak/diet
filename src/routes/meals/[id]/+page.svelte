<script lang="ts">
	import NutritionTable from '$lib/components/NutritionTable.svelte';
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeftIcon.svelte';
	import PencilIcon from '$lib/components/icons/PencilIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { users } from '$lib/config/users';
	import { pl } from '$lib/i18n/pl';
	import { formatAmount, forUser, mealNutrition } from '$lib/nutrition';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const meal = $derived(data.meal);

	const perUser = $derived.by(() => {
		const base = mealNutrition(meal.items);
		return Object.fromEntries(users.map((u) => [u.key, forUser(base, u.multiplier)]));
	});

	/** Multiplier for cooking everyone's portions at once. */
	const totalMultiplier = users.reduce((sum, u) => sum + u.multiplier, 0);
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
		<h2 class="section-label">{pl.meals.amountsPerUser}</h2>
		<table class="amounts">
			<thead>
				<tr>
					<th scope="col">{pl.meals.ingredient}</th>
					{#each users as user (user.key)}
						<th scope="col" class="amount" style:color={user.color}>{user.name}</th>
					{/each}
					<th scope="col" class="amount total">{pl.meals.amountsTotal}</th>
				</tr>
			</thead>
			<tbody>
				{#each meal.items as item, i (i)}
					<tr>
						<th scope="row">{item.ingredient.name}</th>
						{#each users as user (user.key)}
							<td class="amount" style:background={user.tint}>
								{formatAmount(item.amount * user.multiplier, item.ingredient.unit)}
								{pl.units[item.ingredient.unit]}
							</td>
						{/each}
						<td class="amount total">
							{formatAmount(item.amount * totalMultiplier, item.ingredient.unit)}
							{pl.units[item.ingredient.unit]}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section class="card">
		<h2 class="section-label">{pl.meals.nutrition}</h2>
		<NutritionTable {perUser} />
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
	.amounts .total {
		font-weight: 700;
	}
	.preparation {
		margin: 0;
		font-size: var(--font-size-body);
		line-height: 1.6;
		white-space: pre-line;
	}
</style>
