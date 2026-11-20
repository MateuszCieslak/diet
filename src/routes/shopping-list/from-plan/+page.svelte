<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeftIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { pl } from '$lib/i18n/pl';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const formId = $props.id();

	/** Unticked meal ids; everything else is selected, so new meals start ticked. */
	let unticked = $state<number[]>([]);
	let clientError = $state<string | null>(null);
	let modeOpen = $state(false);

	const total = $derived(data.days.reduce((sum, day) => sum + day.meals.length, 0));
	const count = $derived(
		total - data.days.flatMap((d) => d.meals).filter((m) => unticked.includes(m.id)).length
	);
	const error = $derived(clientError ?? form?.error ?? null);

	// The server asks for a mode when the list gained open items after this page loaded.
	$effect(() => {
		if (form?.needsMode) modeOpen = true;
	});

	const dayFormat = new Intl.DateTimeFormat('pl-PL', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		timeZone: 'UTC'
	});
	function dayLabel(date: string): string {
		const text = dayFormat.format(new Date(`${date}T00:00:00Z`));
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	function toggleMeal(id: number, checked: boolean) {
		unticked = checked ? unticked.filter((u) => u !== id) : [...unticked, id];
		clientError = null;
	}

	function toggleDay(ids: number[], checked: boolean) {
		const rest = unticked.filter((u) => !ids.includes(u));
		unticked = checked ? rest : [...rest, ...ids];
		clientError = null;
	}
</script>

<svelte:head>
	<title>{pl.shoppingFromPlan.title} · {pl.appName}</title>
</svelte:head>

<header class="header">
	<Button href="/shopping-list" variant="ghost" iconOnly aria-label={pl.common.back}>
		<ArrowLeftIcon />
	</Button>
	<h1>{pl.shoppingFromPlan.title}</h1>
</header>

{#if data.days.length === 0}
	<div class="content empty">
		<p class="muted">{pl.shoppingFromPlan.empty}</p>
		<Button href="/plan" variant="outline">{pl.shoppingFromPlan.goToPlan}</Button>
	</div>
{:else}
	<form
		id={formId}
		method="POST"
		action="?/create"
		class="content stack"
		use:enhance={({ formData, cancel }) => {
			if (count === 0) {
				clientError = pl.errors.nothingSelected;
				cancel();
				return;
			}
			if (data.hasOpenItems && !formData.has('mode')) {
				modeOpen = true;
				cancel();
				return;
			}
			modeOpen = false;
			return ({ update }) => update({ reset: false });
		}}
	>
		{#each data.days as day (day.date)}
			{@const ids = day.meals.map((m) => m.id)}
			{@const tickedCount = ids.filter((id) => !unticked.includes(id)).length}
			{@const label = dayLabel(day.date)}
			<section class="card" class:skipped={tickedCount === 0}>
				<label class="day">
					<input
						type="checkbox"
						checked={tickedCount > 0}
						indeterminate={tickedCount > 0 && tickedCount < ids.length}
						aria-label={pl.shoppingFromPlan.selectDay(label)}
						onchange={(e) => toggleDay(ids, e.currentTarget.checked)}
					/>
					<span>{label}</span>
				</label>
				{#if tickedCount > 0}
					<ul>
						{#each day.meals as meal (meal.id)}
							{@const checked = !unticked.includes(meal.id)}
							<li>
								<label class="meal" class:off={!checked}>
									<input
										type="checkbox"
										name="planMealIds"
										value={meal.id}
										{checked}
										onchange={(e) => toggleMeal(meal.id, e.currentTarget.checked)}
									/>
									<span>{meal.name}</span>
								</label>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/each}

		<div class="footer">
			{#if error}
				<p class="error" role="alert">{error}</p>
			{/if}
			<div class="footer-row">
				<span class="muted">{pl.shoppingFromPlan.selected(count)}</span>
				<Button type="submit">{pl.shoppingFromPlan.create}</Button>
			</div>
		</div>
	</form>

	<Dialog bind:open={modeOpen} title={pl.shoppingFromPlan.modeTitle}>
		<div class="stack">
			<p class="note">{pl.shoppingFromPlan.modeNote}</p>
			<div class="actions">
				<Button type="submit" form={formId} name="mode" value="merge" variant="outline">
					{pl.shoppingFromPlan.merge}
				</Button>
				<Button type="submit" form={formId} name="mode" value="replace">
					{pl.shoppingFromPlan.replace}
				</Button>
			</div>
		</div>
	</Dialog>
{/if}

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
		margin: 0;
		font-size: var(--font-size-subtitle);
		font-weight: 700;
	}
	.content {
		padding: var(--space-4) var(--gutter) 0;
	}
	.empty {
		align-items: center;
		text-align: center;
	}
	.empty p {
		margin: 0 0 var(--space-3);
	}
	.card {
		padding: var(--space-1) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}
	.card.skipped {
		background: var(--color-surface-muted);
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid var(--color-divider);
	}
	li + li {
		border-top: 1px solid var(--color-divider);
	}
	label {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: var(--touch-target);
		cursor: pointer;
	}
	.day {
		font-weight: 700;
	}
	.skipped .day {
		color: var(--color-muted);
	}
	.meal {
		padding-left: var(--space-2);
		font-size: var(--font-size-body);
	}
	.meal.off {
		color: var(--color-muted);
		text-decoration: line-through;
	}
	input[type='checkbox'] {
		flex-shrink: 0;
		width: 22px;
		height: 22px;
		margin: 0;
		accent-color: var(--color-accent);
	}
	.footer {
		position: sticky;
		/* Sits just above the fixed bottom navigation. */
		bottom: calc(61px + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0 calc(-1 * var(--gutter));
		padding: var(--space-3) var(--gutter);
		border-top: 1px solid var(--color-border);
		background: var(--color-surface);
	}
	.footer-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		font-size: var(--font-size-secondary);
	}
	.error {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--font-size-secondary);
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
