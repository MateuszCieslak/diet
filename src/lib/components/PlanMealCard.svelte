<script lang="ts">
	import { enhance } from '$app/forms';
	import GripIcon from '$lib/components/icons/GripIcon.svelte';
	import ImageIcon from '$lib/components/icons/ImageIcon.svelte';
	import MoreIcon from '$lib/components/icons/MoreIcon.svelte';
	import type { MealTypeKey } from '$lib/config/meal-types';
	import { users } from '$lib/config/users';
	import { pl } from '$lib/i18n/pl';
	import { formatKcal, formatMacro, planMealPerUser } from '$lib/nutrition';
	import type { PlanMeal } from '$lib/plan';

	type Props = {
		meal: PlanMeal;
		/** Types of the source meal; empty when it was deleted. */
		types: MealTypeKey[];
		/** Opens the meal picker to replace this meal. */
		onReplace: () => void;
	};

	/** A planned meal: header with menu, then one tile per person that toggles their exclusion. */
	let { meal, types, onReplace }: Props = $props();

	const menuId = $props.id();
	let menuOpen = $state(false);
	let menuRoot = $state<HTMLElement>();

	const perUser = $derived(planMealPerUser(meal, users));

	function closeOnOutside(event: MouseEvent) {
		if (menuOpen && !menuRoot?.contains(event.target as Node)) menuOpen = false;
	}

	function closeOnEscape(event: KeyboardEvent) {
		if (menuOpen && event.key === 'Escape') menuOpen = false;
	}
</script>

<svelte:window onclick={closeOnOutside} onkeydown={closeOnEscape} />

<article class="card">
	<div class="top">
		<!-- Drag to reorder arrives in a later task; the handle is only visual for now. -->
		<span class="handle" title={pl.plan.dragHandle} aria-hidden="true"><GripIcon size={20} /></span>
		{#if meal.photo}
			<img class="photo" src="/photos/{meal.photo}" alt="" loading="lazy" />
		{:else}
			<span class="photo placeholder"><ImageIcon size={20} /></span>
		{/if}
		<div class="text">
			<h3><a href="/plan/{meal.id}">{meal.name}</a></h3>
			{#if types.length > 0}
				<p class="muted types">{types.map((t) => pl.mealTypes[t]).join(' · ')}</p>
			{/if}
		</div>
		<div class="menu" bind:this={menuRoot}>
			<button
				type="button"
				class="menu-button"
				aria-label={pl.plan.menu(meal.name)}
				aria-expanded={menuOpen}
				aria-controls={menuId}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<MoreIcon size={20} />
			</button>
			{#if menuOpen}
				<ul id={menuId} class="menu-list">
					<li>
						<button
							type="button"
							onclick={() => {
								menuOpen = false;
								onReplace();
							}}
						>
							{pl.plan.replace}
						</button>
					</li>
					<li><a href="/plan/{meal.id}/edit">{pl.plan.edit}</a></li>
					<li>
						<form method="POST" action="?/remove" use:enhance>
							<input type="hidden" name="planMealId" value={meal.id} />
							<button type="submit" class="danger">{pl.plan.remove}</button>
						</form>
					</li>
				</ul>
			{/if}
		</div>
	</div>

	<div class="tiles">
		{#each users as user (user.key)}
			{@const n = perUser[user.key]}
			<form method="POST" action="?/toggleExclusion" use:enhance>
				<input type="hidden" name="planMealId" value={meal.id} />
				<input type="hidden" name="userKey" value={user.key} />
				<button
					type="submit"
					class="tile"
					class:excluded={!n}
					style:--person-color={user.color}
					style:--person-tint={user.tint}
					aria-pressed={n !== null}
					aria-label={pl.plan.eats(user.name)}
				>
					<span class="person"><span class="dot"></span>{user.name}</span>
					{#if n}
						<span class="kcal">{formatKcal(n.kcal)} {pl.nutrition.kcal}</span>
						<span class="macros">
							{pl.ingredients.macros(
								formatMacro(n.protein),
								formatMacro(n.fat),
								formatMacro(n.carbs)
							)}
						</span>
					{:else}
						<span class="kcal">{pl.plan.notEating}</span>
						<span class="macros">{pl.plan.tapToAdd}</span>
					{/if}
				</button>
			</form>
		{/each}
	</div>
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}
	.top {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	.handle {
		display: inline-flex;
		flex-shrink: 0;
		color: var(--color-subtle);
	}
	.photo {
		flex-shrink: 0;
		width: 52px;
		height: 52px;
		border-radius: var(--radius-md);
		object-fit: cover;
		background: var(--color-surface-muted);
	}
	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-subtle);
	}
	.text {
		flex: 1;
		min-width: 0;
	}
	h3 {
		margin: 0;
		font-size: var(--font-size-body);
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	h3 a {
		color: inherit;
		text-decoration: none;
	}
	h3 a:hover {
		text-decoration: underline;
	}
	.types {
		margin: 2px 0 0;
		font-size: var(--font-size-secondary);
	}
	.menu {
		position: relative;
		flex-shrink: 0;
	}
	.menu-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--touch-target);
		height: var(--touch-target);
		border: none;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-ink);
		cursor: pointer;
	}
	.menu-button:hover,
	.menu-button[aria-expanded='true'] {
		background: var(--color-surface-muted);
	}
	.menu-list {
		position: absolute;
		top: calc(100% + var(--space-1));
		right: 0;
		z-index: 5;
		min-width: 160px;
		margin: 0;
		padding: var(--space-1) 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
		list-style: none;
	}
	.menu-list form {
		margin: 0;
	}
	.menu-list a,
	.menu-list button {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: var(--touch-target);
		padding: 0 var(--space-4);
		border: none;
		background: transparent;
		color: var(--color-ink);
		font-size: var(--font-size-body);
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}
	.menu-list a:hover,
	.menu-list button:hover {
		background: var(--color-surface-muted);
	}
	.menu-list .danger {
		color: var(--color-danger);
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
		gap: var(--space-2);
	}
	.tiles form {
		display: flex;
		margin: 0;
	}
	.tile {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		min-height: var(--touch-target);
		padding: var(--space-2) var(--space-3);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		background: var(--person-tint);
		color: var(--color-ink);
		text-align: left;
		cursor: pointer;
	}
	.tile.excluded {
		border: 1px dashed var(--color-border-strong);
		background: var(--color-surface);
		color: var(--color-muted);
	}
	.person {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--person-color);
		font-size: var(--font-size-label);
		font-weight: 700;
	}
	.excluded .person {
		color: var(--color-muted);
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: var(--radius-pill);
		background: var(--person-color);
	}
	.kcal {
		font-size: var(--font-size-body);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.excluded .kcal {
		font-weight: 600;
	}
	.macros {
		color: var(--color-muted);
		font-size: var(--font-size-label);
		font-variant-numeric: tabular-nums;
	}
	button:focus-visible,
	a:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
