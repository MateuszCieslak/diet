<script lang="ts">
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import { pl } from '$lib/i18n/pl';
	import { formatKcal } from '$lib/nutrition';
	import type { Ingredient } from '$lib/schemas/ingredient';

	type Props = {
		onPick: (ingredient: Ingredient) => void;
		/** Ingredients already in the meal: shown, but not pickable again. */
		pickedIds?: readonly number[];
	};

	/**
	 * An ingredient search with results inline. The input has no `name`, so it is never submitted
	 * with the surrounding form; Enter picks the first result instead of submitting.
	 */
	let { onPick, pickedIds = [] }: Props = $props();

	let query = $state('');
	let results = $state<Ingredient[]>([]);
	let failed = $state(false);
	let searched = $state(false);
	const id = $props.id();

	const debounceMs = 300;

	$effect(() => {
		const q = query.trim();
		if (q === '') {
			results = [];
			searched = false;
			return;
		}
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/ingredients?q=${encodeURIComponent(q)}`, {
					signal: controller.signal
				});
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				results = await res.json();
				failed = false;
			} catch (e) {
				if (controller.signal.aborted) return;
				console.error(e);
				results = [];
				failed = true;
			}
			searched = true;
		}, debounceMs);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});

	function pick(ingredient: Ingredient) {
		onPick(ingredient);
		query = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		const first = results.find((r) => !pickedIds.includes(r.id));
		if (first) pick(first);
	}
</script>

<div class="picker">
	<label for={id} class="visually-hidden">{pl.meals.ingredientSearch}</label>
	<div class="search">
		<SearchIcon size={20} />
		<input
			{id}
			type="search"
			bind:value={query}
			onkeydown={handleKeydown}
			placeholder={pl.meals.ingredientSearchPlaceholder}
			autocomplete="off"
			enterkeyhint="search"
		/>
	</div>

	{#if failed}
		<p class="note error" role="alert">{pl.meals.ingredientSearchFailed}</p>
	{:else if searched && results.length === 0}
		<p class="note muted">{pl.meals.ingredientNoResults}</p>
	{:else if results.length > 0}
		<ul>
			{#each results as ingredient (ingredient.id)}
				{@const picked = pickedIds.includes(ingredient.id)}
				<li>
					<button type="button" disabled={picked} onclick={() => pick(ingredient)}>
						<span class="name">{ingredient.name}</span>
						<span class="muted meta">
							{picked
								? pl.meals.ingredientAdded
								: pl.ingredients.kcalPerUnit(formatKcal(ingredient.kcal), ingredient.unit)}
						</span>
						{#if !picked}<PlusIcon size={20} />{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.search {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0 var(--space-3);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--color-bg);
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
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		overflow: hidden;
	}
	li + li {
		border-top: 1px solid var(--color-divider);
	}
	button {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		min-height: var(--touch-target);
		padding: var(--space-2) var(--space-3);
		border: none;
		background: transparent;
		color: var(--color-accent);
		text-align: left;
		cursor: pointer;
	}
	button:hover:not(:disabled),
	button:active:not(:disabled) {
		background: var(--color-accent-soft);
	}
	button:disabled {
		cursor: default;
	}
	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}
	.name {
		flex: 1;
		color: var(--color-ink);
		font-weight: 600;
	}
	.meta {
		font-size: var(--font-size-secondary);
	}
	.note {
		margin: 0;
		font-size: var(--font-size-secondary);
	}
	.error {
		color: var(--color-danger);
	}
</style>
