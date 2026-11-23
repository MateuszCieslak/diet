<script lang="ts">
	import { untrack } from 'svelte';
	import ImageIcon from '$lib/components/icons/ImageIcon.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import { mealTypes, type MealTypeKey } from '$lib/config/meal-types';
	import { pl } from '$lib/i18n/pl';
	import { formatKcal } from '$lib/nutrition';
	import { PagedSearch } from '$lib/paged-search.svelte';
	import type { MealListItem, MealListPage } from '$lib/schemas/meal';
	import { searchTerm } from '$lib/search';

	type Filter = { q: string; type?: MealTypeKey };

	type Props = {
		/** Called with the tapped meal. Without it, meals are links to `/meals/[id]` in a grid. */
		onPick?: (meal: MealListItem) => void;
		/** The first page loaded on the server, with the filter it was loaded for. */
		initial?: Filter & { page: MealListPage };
		/** Called after the search or type changes, e.g. to keep the page URL in sync. */
		onFilterChange?: (filter: Filter) => void;
	};

	/**
	 * Meal search (from two characters) with type chips and scroll-loaded results from
	 * `/api/meals`. Without `initial`, the first page is fetched on mount.
	 */
	let { onPick, initial, onFilterChange }: Props = $props();

	const id = $props.id();

	// `initial` is only the starting point; the picker owns the filter and the list after that.
	const start = untrack(() => initial);
	let query = $state(start?.q ?? '');
	let type = $state<MealTypeKey | undefined>(start?.type);

	const list = new PagedSearch<MealListItem, Filter>({
		filter: () => ({ q: searchTerm(query), type }),
		url: (filter, cursor) => {
			const params = new URLSearchParams();
			if (filter.q) params.set('q', filter.q);
			if (filter.type) params.set('type', filter.type);
			if (cursor) params.set('cursor', cursor);
			return `/api/meals?${params}`;
		},
		initial: start && { filter: { q: start.q, type: start.type }, page: start.page },
		onLoad: (filter) => onFilterChange?.(filter)
	});

	const filtered = $derived(searchTerm(query) !== '' || type !== undefined);
</script>

<div class="picker">
	<div class="search">
		<label for={id} class="visually-hidden">{pl.meals.searchLabel}</label>
		<SearchIcon size={20} />
		<input
			{id}
			type="search"
			bind:value={query}
			placeholder={pl.meals.searchPlaceholder}
			autocomplete="off"
			enterkeyhint="search"
		/>
	</div>

	<div class="chips" role="group" aria-label={pl.meals.types}>
		<Chip pressed={type === undefined} onclick={() => (type = undefined)}>
			{pl.meals.allTypes}
		</Chip>
		{#each mealTypes as key (key)}
			<Chip pressed={type === key} onclick={() => (type = type === key ? undefined : key)}>
				{pl.mealTypes[key]}
			</Chip>
		{/each}
	</div>

	{#if list.loadedFilter && list.items.length === 0 && !list.failed}
		<p class="muted note">{filtered ? pl.meals.noResults : pl.meals.empty}</p>
	{:else if !onPick}
		<ul class="grid">
			{#each list.items as meal (meal.id)}
				<li>
					<a class="card" href="/meals/{meal.id}">
						{@render photo(meal)}
						<span class="card-text">
							<span class="name">{meal.name}</span>
							{@render meta(meal)}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<ul class="rows">
			{#each list.items as meal (meal.id)}
				<li>
					<button type="button" class="row-button" onclick={() => onPick?.(meal)}>
						{@render photo(meal)}
						<span class="card-text">
							<span class="name">{meal.name}</span>
							{@render meta(meal)}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if list.failed}
		<div class="note error" role="alert">
			<span>{pl.meals.loadFailed}</span>
			<Button variant="outline" onclick={() => list.retry()}>{pl.common.retry}</Button>
		</div>
	{:else if !list.loadedFilter || list.loadingMore}
		<p class="muted note" aria-live="polite">{pl.common.loading}</p>
	{/if}

	<div {@attach list.sentinel} class="sentinel" aria-hidden="true"></div>
</div>

{#snippet photo(meal: MealListItem)}
	{#if meal.photo}
		<img class="photo" src="/photos/{meal.photo}" alt="" loading="lazy" />
	{:else}
		<span class="photo placeholder"><ImageIcon /></span>
	{/if}
{/snippet}

{#snippet meta(meal: MealListItem)}
	<span class="muted meta">{meal.types.map((t) => pl.mealTypes[t]).join(' · ')}</span>
	<span class="kcal">{pl.meals.kcalPerPortion(formatKcal(meal.base.kcal))}</span>
{/snippet}

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.search {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0 var(--space-3);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-subtle);
	}
	.search:focus-within {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
	}
	input {
		flex: 1;
		min-width: 0;
		min-height: var(--touch-target);
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-ink);
	}
	input:focus {
		outline: none;
	}
	.chips {
		display: flex;
		gap: var(--space-2);
		/* Scroll sideways inside the gutter; the padding keeps focus outlines visible. */
		margin: 0 calc(-1 * var(--gutter));
		padding: 2px var(--gutter) var(--space-1);
		overflow-x: auto;
		scrollbar-width: none;
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-3);
	}
	.card {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		color: inherit;
		text-decoration: none;
		overflow: hidden;
	}
	.card:hover,
	.card:active {
		border-color: var(--color-border-strong);
	}
	.card:focus-visible,
	.row-button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}
	.card .photo {
		width: 100%;
		aspect-ratio: 4 / 3;
	}
	.card-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.card .card-text {
		padding: var(--space-2) var(--space-3) var(--space-3);
	}
	.photo {
		display: block;
		object-fit: cover;
		background: var(--color-surface-muted);
	}
	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-subtle);
	}
	.name {
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.meta,
	.kcal {
		font-size: var(--font-size-secondary);
	}
	.kcal {
		font-weight: 600;
	}
	.rows {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		overflow: hidden;
	}
	.rows li + li {
		border-top: 1px solid var(--color-divider);
	}
	.row-button {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		min-height: var(--touch-target);
		padding: var(--space-2) var(--space-3);
		border: none;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}
	.row-button:hover,
	.row-button:active {
		background: var(--color-accent-soft);
	}
	.row-button .photo {
		flex-shrink: 0;
		width: 56px;
		height: 56px;
		border-radius: var(--radius-md);
	}
	.note {
		margin: var(--space-2) 0;
		font-size: var(--font-size-secondary);
		text-align: center;
	}
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-danger);
	}
	.sentinel {
		height: 1px;
	}
</style>
