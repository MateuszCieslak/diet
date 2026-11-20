<script lang="ts">
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { pl } from '$lib/i18n/pl';
	import { formatKcal, formatMacro } from '$lib/nutrition';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{pl.ingredients.title} · {pl.appName}</title>
</svelte:head>

<header class="header">
	<h1>{pl.ingredients.title}</h1>
	<Button href="/ingredients/new">
		<PlusIcon size={20} />
		{pl.common.new}
	</Button>
</header>

<div class="content stack">
	<form method="GET" role="search" class="search">
		<label for="ingredient-search" class="visually-hidden">{pl.ingredients.searchLabel}</label>
		<input
			id="ingredient-search"
			type="search"
			name="q"
			value={data.q}
			placeholder={pl.ingredients.searchPlaceholder}
			autocomplete="off"
		/>
		<button type="submit" aria-label={pl.common.search}><SearchIcon size={20} /></button>
	</form>

	{#if data.ingredients.length === 0}
		<p class="muted empty">{data.q ? pl.ingredients.noResults : pl.ingredients.empty}</p>
	{:else}
		<ul class="card">
			{#each data.ingredients as ingredient (ingredient.id)}
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
</div>

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
	.content {
		padding: var(--space-2) var(--gutter) var(--space-4);
	}
	.search {
		display: flex;
		gap: var(--space-2);
	}
	.search input {
		flex: 1;
		min-width: 0;
		min-height: var(--touch-target);
		padding: 0 var(--space-3);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-ink);
	}
	.search input:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
	}
	.search button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--touch-target);
		height: var(--touch-target);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-ink);
		cursor: pointer;
	}
	.empty {
		margin: var(--space-4) 0;
		text-align: center;
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
