<script lang="ts">
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeftIcon.svelte';
	import PencilIcon from '$lib/components/icons/PencilIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { pl } from '$lib/i18n/pl';
	import { keepScreenOn } from '$lib/wake-lock';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const meal = $derived(data.meal);
	const table = $derived(data.table);
	// With one person eating, the total would just repeat their column.
	const showTotal = $derived(table.columns.length > 1);

	// Dates are calendar days, so format them at UTC midnight to avoid any time-zone shift.
	const dayFormat = new Intl.DateTimeFormat('pl-PL', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		timeZone: 'UTC'
	});
	const subtitle = $derived.by(() => {
		const day = dayFormat.format(new Date(`${meal.date}T00:00:00Z`));
		const parts = [
			day.charAt(0).toUpperCase() + day.slice(1),
			...data.types.map((t) => pl.mealTypes[t])
		];
		return parts.join(' · ');
	});

	$effect(() => keepScreenOn());
</script>

<svelte:head>
	<title>{meal.name} · {pl.appName}</title>
</svelte:head>

<header class="header">
	<Button href="/plan?date={meal.date}" variant="ghost" iconOnly aria-label={pl.common.back}>
		<ArrowLeftIcon />
	</Button>
	<div class="heading">
		<h1>{meal.name}</h1>
		<p class="subtitle">{subtitle}</p>
	</div>
	<Button href="/plan/{meal.id}/edit" variant="outline" iconOnly aria-label={pl.cooking.edit}>
		<PencilIcon size={20} />
	</Button>
</header>

<div class="content stack">
	<section class="card">
		<h2 class="section-label">{pl.cooking.ingredients}</h2>
		{#if table.columns.length === 0}
			<p class="note">{pl.cooking.allExcluded}</p>
		{:else}
			<table class="amounts">
				<thead>
					<tr>
						<th scope="col">{pl.cooking.ingredient}</th>
						{#each table.columns as user (user.key)}
							<th scope="col" class="amount" style:color={user.color}>{user.name}</th>
						{/each}
						{#if showTotal}
							<th scope="col" class="amount total">{pl.cooking.total}</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each table.rows as row, i (i)}
						<tr>
							<th scope="row">{row.name}</th>
							{#each row.amounts as amount, c (table.columns[c].key)}
								<td class="amount" style:background={table.columns[c].tint}>{amount}</td>
							{/each}
							{#if showTotal}
								<td class="amount total">{row.total}</td>
							{/if}
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<th scope="row">{pl.cooking.kcalPerPortion}</th>
						{#each table.kcal as kcal, c (table.columns[c].key)}
							<td class="amount" style:color={table.columns[c].color}>{kcal}</td>
						{/each}
						{#if showTotal}
							<td class="amount total">{table.totalKcal}</td>
						{/if}
					</tr>
				</tfoot>
			</table>
		{/if}
	</section>

	{#if meal.preparation}
		<section class="card">
			<h2 class="section-label">{pl.cooking.preparation}</h2>
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
	.heading {
		flex: 1;
		min-width: 0;
	}
	h1 {
		margin: 0;
		font-size: var(--font-size-subtitle);
		font-weight: 700;
		overflow-wrap: anywhere;
	}
	.subtitle {
		margin: 0;
		color: var(--color-muted);
		font-size: var(--font-size-secondary);
	}
	.content {
		gap: var(--space-4);
		padding: var(--space-4) var(--gutter);
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
	.note {
		margin: 0;
		color: var(--color-muted);
		font-size: var(--font-size-body);
	}
	.amounts {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-body);
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
	.amounts thead th:first-child,
	.amounts tfoot th {
		color: var(--color-muted);
	}
	.amounts tbody tr + tr {
		border-top: 1px solid var(--color-divider);
	}
	.amounts tbody th {
		font-weight: 600;
	}
	.amounts tfoot tr {
		border-top: 1px solid var(--color-border);
	}
	.amounts tfoot th {
		font-size: var(--font-size-secondary);
		font-weight: 600;
	}
	.amounts tfoot td {
		font-weight: 700;
	}
	.amounts .amount {
		text-align: right;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.amounts .total {
		border-left: 1px solid var(--color-divider);
		font-weight: 700;
	}
	.preparation {
		margin: 0;
		font-size: var(--font-size-body);
		line-height: 1.6;
		white-space: pre-line;
	}
</style>
