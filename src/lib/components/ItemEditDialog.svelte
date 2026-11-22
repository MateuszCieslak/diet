<script lang="ts">
	import IngredientPicker from '$lib/components/IngredientPicker.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import NumberField from '$lib/components/ui/NumberField.svelte';
	import { pl } from '$lib/i18n/pl';
	import { initialReplacementAmount, matchKcalAmount, parseAmountInput } from '$lib/item-edit';
	import { formatKcal, formatMacro, itemNutrition, type Nutrition } from '$lib/nutrition';
	import type { Ingredient } from '$lib/schemas/ingredient';
	import type { MealItem } from '$lib/schemas/meal';

	type Props = {
		open?: boolean;
		/** The item being edited; for a new item, the picked ingredient with any amount. */
		item: MealItem;
		/** A new item has nothing to compare against and starts without an amount. */
		isNew?: boolean;
		/** Ingredients already in the meal; the replacement search does not offer them. */
		pickedIds?: readonly number[];
		onApply: (item: MealItem) => void;
	};

	/**
	 * Edits one ingredient of a planned meal: its amount, or a replacement ingredient compared with
	 * the old one ("Było" / "Będzie"), with a button that matches the old kcal.
	 */
	let { open = $bindable(false), item, isNew = false, pickedIds = [], onApply }: Props = $props();

	const amountFormat = new Intl.NumberFormat('pl-PL', {
		maximumFractionDigits: 2,
		useGrouping: false
	});

	/** The replacement picked in this dialog; `null` keeps the item's own ingredient. */
	let picked = $state<Ingredient | null>(null);
	let amountText = $state('');

	// Start from the given item each time the dialog opens.
	$effect.pre(() => {
		if (!open) return;
		picked = null;
		amountText = isNew ? '' : amountFormat.format(item.amount);
	});

	const ingredient = $derived(picked ?? item.ingredient);
	const replaced = $derived(picked !== null);
	const amount = $derived(parseAmountInput(amountText));
	const before = $derived(itemNutrition(item.ingredient, item.amount));
	const after = $derived(itemNutrition(ingredient, amount ?? 0));
	const matched = $derived(matchKcalAmount(before.kcal, ingredient));
	const rows = $derived<{ label: string; n: Nutrition }[]>(
		isNew
			? [{ label: pl.planEdit.after, n: after }]
			: [
					{ label: pl.planEdit.before, n: before },
					{ label: pl.planEdit.after, n: after }
				]
	);

	function replace(next: Ingredient) {
		const start = initialReplacementAmount(item.ingredient.unit, next.unit, item.amount);
		picked = next;
		amountText = start === null ? '' : amountFormat.format(start);
	}

	function apply() {
		if (amount === null) return;
		onApply({ ingredient, amount });
		open = false;
	}
</script>

<Dialog bind:open title={pl.planEdit.editItem} subtitle={ingredient.name}>
	<div class="stack body">
		<NumberField
			name="itemAmount"
			label={pl.meals.amount}
			unit={ingredient.unit}
			bind:value={amountText}
		/>

		{#if isNew || replaced}
			<table class="compare">
				<thead>
					<tr>
						<th scope="col"><span class="visually-hidden">{pl.meals.ingredient}</span></th>
						<th scope="col">{pl.nutrition.kcal}</th>
						<th scope="col">
							<abbr title={pl.nutrition.protein}>{pl.nutrition.proteinShort}</abbr>
						</th>
						<th scope="col"><abbr title={pl.nutrition.fat}>{pl.nutrition.fatShort}</abbr></th>
						<th scope="col"><abbr title={pl.nutrition.carbs}>{pl.nutrition.carbsShort}</abbr></th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.label)}
						<tr>
							<th scope="row">{row.label}</th>
							<td class="kcal">{formatKcal(row.n.kcal)}</td>
							<td>{formatMacro(row.n.protein)}</td>
							<td>{formatMacro(row.n.fat)}</td>
							<td>{formatMacro(row.n.carbs)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}

		{#if replaced}
			<Button
				variant="outline"
				disabled={matched === null}
				onclick={() => {
					if (matched !== null) amountText = amountFormat.format(matched);
				}}
			>
				{pl.planEdit.matchKcal}
			</Button>
		{/if}

		{#if !isNew}
			<div class="stack replace">
				<h3 class="section-label">{pl.planEdit.replace}</h3>
				<IngredientPicker
					onPick={replace}
					pickedIds={pickedIds.filter((id) => id !== item.ingredient.id)}
				/>
			</div>
		{/if}

		<div class="actions">
			<Button variant="ghost" onclick={() => (open = false)}>{pl.planEdit.cancel}</Button>
			<Button disabled={amount === null} onclick={apply}>{pl.planEdit.apply}</Button>
		</div>
	</div>
</Dialog>

<style>
	.body {
		gap: var(--space-4);
	}
	.compare {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-secondary);
		font-variant-numeric: tabular-nums;
	}
	.compare th,
	.compare td {
		padding: var(--space-2) var(--space-1);
		text-align: right;
	}
	.compare thead th {
		color: var(--color-muted);
		font-size: var(--font-size-label);
		font-weight: 700;
	}
	.compare tbody tr + tr {
		border-top: 1px solid var(--color-divider);
	}
	.compare tbody th {
		font-weight: 600;
		text-align: left;
	}
	.compare .kcal {
		font-weight: 700;
	}
	abbr {
		text-decoration: none;
	}
	.replace {
		gap: var(--space-2);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
	}
</style>
