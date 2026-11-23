<script lang="ts">
	import { untrack } from 'svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { pl } from '$lib/i18n/pl';
	import { formatKcal, formatMacro } from '$lib/nutrition';
	import { PagedSearch } from '$lib/paged-search.svelte';
	import type { Ingredient, IngredientPage } from '$lib/schemas/ingredient';
	import { searchTerm } from '$lib/search';

	type Filter = { q: string };

	type Props = {
		/** The first page loaded on the server, with the search it was loaded for. */
		initial: Filter & { page: IngredientPage };
		/** Called after the search changes, e.g. to keep the page URL in sync. */
		onFilterChange?: (filter: Filter) => void;
	};

	/**
	 * The ingredients list: a search (from two characters, while typing) and scroll-loaded
	 * results from `/api/ingredients`, each linking to its edit page.
	 */
	let { initial, onFilterChange }: Props = $props();

	const id = $props.id();

	// `initial` is only the starting point; the list owns the search and the items after that.
	const start = untrack(() => initial);
	let query = $state(start.q);

	const list = new PagedSearch<Ingredient, Filter>({
		filter: () => ({ q: searchTerm(query) }),
		url: (filter, cursor) => {
			const params = new URLSearchParams();
			if (filter.q) params.set('q', filter.q);
			if (cursor) params.set('cursor', cursor);
			return `/api/ingredients?${params}`;
		},
		initial: { filter: { q: start.q }, page: start.page },
		onLoad: (filter) => onFilterChange?.(filter)
	});
</script>

<div class="list">
	<div class="search" role="search">
		<label for={id} class="visually-hidden">{pl.ingredients.searchLabel}</label>
		<SearchIcon size={20} />
		<input
			{id}
			type="search"
			bind:value={query}
			placeholder={pl.ingredients.searchPlaceholder}
			autocomplete="off"
			enterkeyhint="search"
		/>
	</div>

	{#if list.loadedFilter && list.items.length === 0 && !list.failed}
		<p class="muted note">
			{list.loadedFilter.q ? pl.ingredients.noResults : pl.ingredients.empty}
		</p>
	{:else if list.items.length > 0}
		<ul class="card">
			{#each list.items as ingredient (ingredient.id)}
				<li>
					<a href="/ingredients/{ingredient.id}/edit">
						<span class="main">
							<span class="name">{ingredient.name}</span>
							<span class="muted macros">
								{pl.ingredients.macros(
									formatMacro(ingredient.protein),
									formatMacro(ingredient.fat),
									formatMacro(ingredient.carbs)
								)}
							</span>
						</span>
						<span class="side">
							<span class="kcal">
								{pl.ingredients.kcalPerUnit(formatKcal(ingredient.kcal), ingredient.unit)}
							</span>
							<span class="tag">{pl.categories[ingredient.category]}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if list.failed}
		<div class="note error" role="alert">
			<span>{pl.ingredients.loadFailed}</span>
			<Button variant="outline" onclick={() => list.retry()}>{pl.common.retry}</Button>
		</div>
	{:else if !list.loadedFilter || list.loadingMore}
		<p class="muted note" aria-live="polite">{pl.common.loading}</p>
	{/if}

	<div {@attach list.sentinel} class="sentinel" aria-hidden="true"></div>
</div>

<style>
	.list {
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
	.card {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		overflow: hidden;
	}
	li + li {
		border-top: 1px solid var(--color-divider);
	}
	a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		min-height: 60px;
		padding: var(--space-3) var(--space-4);
		color: inherit;
		text-decoration: none;
	}
	a:hover,
	a:active {
		background: var(--color-bg);
	}
	a:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}
	.main,
	.side {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.main {
		min-width: 0;
	}
	.side {
		align-items: flex-end;
		flex-shrink: 0;
	}
	.name {
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.macros,
	.kcal {
		font-size: var(--font-size-secondary);
	}
	.kcal {
		font-weight: 600;
	}
	.tag {
		padding: 2px var(--space-2);
		border-radius: var(--radius-pill);
		background: var(--color-surface-muted);
		color: var(--color-muted);
		font-size: var(--font-size-label);
		font-weight: 600;
	}
</style>
