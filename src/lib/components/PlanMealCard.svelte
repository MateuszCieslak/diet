<script lang="ts">
	import { dragHandle } from 'svelte-dnd-action';
	import { enhance } from '$app/forms';
	import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
	import CircleIcon from '$lib/components/icons/CircleIcon.svelte';
	import GripIcon from '$lib/components/icons/GripIcon.svelte';
	import ImageIcon from '$lib/components/icons/ImageIcon.svelte';
	import MoreIcon from '$lib/components/icons/MoreIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
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

	/**
	 * A planned meal: header with menu, then one tile per person that toggles their exclusion, with
	 * a check button for people who eat it that marks it as eaten.
	 */
	let { meal, types, onReplace }: Props = $props();

	const menuId = $props.id();
	let menuOpen = $state(false);
	let menuRoot = $state<HTMLElement>();
	let confirmOpen = $state(false);

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
		<!-- Works inside the plan page's `dragHandleZone`, which sets its role and tabindex. -->
		<span class="handle" use:dragHandle aria-label={pl.plan.dragHandle}>
			<GripIcon size={20} />
		</span>
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
						<button
							type="button"
							class="danger"
							onclick={() => {
								menuOpen = false;
								confirmOpen = true;
							}}
						>
							{pl.plan.remove}
						</button>
					</li>
				</ul>
			{/if}
		</div>
	</div>

	<div class="tiles">
		{#each users as user (user.key)}
			{@const n = perUser[user.key]}
			{@const eaten = n !== null && meal.eatenUserKeys.includes(user.key)}
			<div class="person-tile" style:--person-color={user.color} style:--person-tint={user.tint}>
				<form method="POST" action="?/toggleExclusion" use:enhance>
					<input type="hidden" name="planMealId" value={meal.id} />
					<input type="hidden" name="userKey" value={user.key} />
					<button
						type="submit"
						class="tile"
						class:excluded={!n}
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
				{#if n}
					<!-- A sibling of the tile button, not inside it: buttons cannot be nested. -->
					<form method="POST" action="?/toggleEaten" use:enhance class="eaten-form">
						<input type="hidden" name="planMealId" value={meal.id} />
						<input type="hidden" name="userKey" value={user.key} />
						<button
							type="submit"
							class="eaten"
							class:done={eaten}
							aria-pressed={eaten}
							aria-label={pl.plan.markEaten(user.name)}
						>
							{#if eaten}<CheckIcon size={18} />{:else}<CircleIcon size={18} />{/if}
						</button>
					</form>
				{/if}
			</div>
		{/each}
	</div>
</article>

<Dialog bind:open={confirmOpen} title={pl.plan.removeTitle(meal.name)}>
	<form
		method="POST"
		action="?/remove"
		class="confirm-actions"
		use:enhance={() => {
			confirmOpen = false;
		}}
	>
		<input type="hidden" name="planMealId" value={meal.id} />
		<Button variant="outline" onclick={() => (confirmOpen = false)}>{pl.common.cancel}</Button>
		<Button type="submit" variant="danger">{pl.plan.remove}</Button>
	</form>
</Dialog>

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
		align-items: center;
		justify-content: center;
		width: var(--touch-target);
		height: var(--touch-target);
		/* A full touch target that takes only the icon's width in the row. */
		margin: 0 calc(-1 * var(--space-3));
		border-radius: var(--radius-md);
		color: var(--color-subtle);
		touch-action: none;
	}
	.handle:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
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
		position: relative;
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		align-self: stretch;
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
	/* The whole title block is the tap target, not just the text line. */
	h3 a::after {
		content: '';
		position: absolute;
		inset: 0;
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
	.confirm-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
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
	.person-tile {
		position: relative;
		display: flex;
	}
	.person-tile > form:first-child {
		display: flex;
		flex: 1;
		margin: 0;
	}
	.eaten-form {
		position: absolute;
		top: 0;
		right: 0;
		margin: 0;
	}
	.eaten {
		display: grid;
		place-items: center;
		width: var(--touch-target);
		height: var(--touch-target);
		padding: 0;
		border: none;
		background: none;
		color: var(--person-color);
		cursor: pointer;
	}
	.eaten :global(svg) {
		padding: 3px;
		border-radius: var(--radius-pill);
	}
	.eaten.done :global(svg) {
		background: var(--person-color);
		color: var(--color-surface);
	}
	.tile {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		min-height: var(--touch-target);
		padding: var(--space-2) var(--space-3);
		/* Room for the eaten check button in the top-right corner. */
		padding-right: var(--touch-target);
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
