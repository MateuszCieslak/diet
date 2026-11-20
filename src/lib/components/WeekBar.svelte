<script lang="ts">
	import ChevronLeftIcon from '$lib/components/icons/ChevronLeftIcon.svelte';
	import ChevronRightIcon from '$lib/components/icons/ChevronRightIcon.svelte';
	import { addDays } from '$lib/dates';
	import { pl } from '$lib/i18n/pl';

	type Props = {
		/** The selected day. */
		date: string;
		today: string;
		/** The seven days of the selected week, Monday first. */
		week: string[];
		/** Days that have at least one planned meal. */
		plannedDates: Set<string>;
	};

	/** Month header with week arrows and a "Today" pill, then a 7-day grid of `?date=` links. */
	let { date, today, week, plannedDates }: Props = $props();

	// Dates are calendar days, so format them at UTC midnight to avoid any time-zone shift.
	const monthFormat = new Intl.DateTimeFormat('pl-PL', {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
	const fullFormat = new Intl.DateTimeFormat('pl-PL', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		timeZone: 'UTC'
	});
	const utc = (d: string) => new Date(`${d}T00:00:00Z`);

	const month = $derived.by(() => {
		const text = monthFormat.format(utc(date));
		return text.charAt(0).toUpperCase() + text.slice(1);
	});
	const href = (d: string) => `/plan?date=${d}`;
</script>

<header class="header">
	<h1>{month}</h1>
	<div class="row">
		<a class="icon-link" href={href(addDays(date, -7))} aria-label={pl.plan.previousWeek}>
			<ChevronLeftIcon size={20} />
		</a>
		<a class="today" href="/plan" aria-current={date === today ? 'date' : undefined}>
			{pl.plan.today}
		</a>
		<a class="icon-link" href={href(addDays(date, 7))} aria-label={pl.plan.nextWeek}>
			<ChevronRightIcon size={20} />
		</a>
	</div>
</header>

<nav class="week" aria-label={pl.plan.week}>
	{#each week as day, i (day)}
		<a
			href={href(day)}
			class="day"
			class:today={day === today}
			aria-current={day === date ? 'page' : undefined}
			aria-label={fullFormat.format(utc(day))}
			data-sveltekit-noscroll
		>
			<span class="weekday">{pl.plan.weekdaysShort[i]}</span>
			<span class="number">{Number(day.slice(8))}</span>
			<span class="dot" class:visible={plannedDates.has(day)}>
				{#if plannedDates.has(day)}<span class="visually-hidden">{pl.plan.hasMeals}</span>{/if}
			</span>
		</a>
	{/each}
</nav>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-4) var(--gutter) var(--space-2);
	}
	h1 {
		margin: 0;
		font-size: var(--font-size-title);
		font-weight: 700;
	}
	.icon-link,
	.today {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--touch-target);
		min-height: var(--touch-target);
		color: var(--color-ink);
		text-decoration: none;
	}
	.icon-link {
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}
	.today {
		padding: 0 var(--space-4);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-pill);
		background: var(--color-surface);
		font-size: var(--font-size-secondary);
		font-weight: 600;
	}
	.week {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: var(--space-1);
		padding: var(--space-2) var(--gutter);
	}
	.day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		min-height: 64px;
		padding: var(--space-2) 0 var(--space-1);
		border-radius: var(--radius-md);
		color: var(--color-ink);
		text-decoration: none;
	}
	.weekday {
		color: var(--color-muted);
		font-size: var(--font-size-label);
		font-weight: 600;
	}
	.number {
		font-size: var(--font-size-body);
		font-weight: 700;
	}
	.day.today .number {
		color: var(--color-accent);
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: var(--radius-pill);
	}
	.dot.visible {
		background: var(--color-accent);
	}
	.day[aria-current='page'] {
		background: var(--color-accent);
	}
	.day[aria-current='page'] .weekday,
	.day[aria-current='page'] .number {
		color: var(--color-surface);
	}
	.day[aria-current='page'] .dot.visible {
		background: var(--color-surface);
	}
	.day:hover:not([aria-current='page']) {
		background: var(--color-surface-muted);
	}
	a:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
