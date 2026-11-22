import type { Unit } from '$lib/config/units';
import { itemNutrition, type IngredientValues } from '$lib/nutrition';

/** A typed amount (`1,5` or `1.5`) as a number; `null` unless positive with at most 2 decimals (DECIMAL(8,2)). */
export function parseAmountInput(text: string): number | null {
	const trimmed = text.trim();
	if (!/^\d+([.,]\d{1,2})?$/.test(trimmed)) return null;
	const value = Number(trimmed.replace(',', '.'));
	return value > 0 ? value : null;
}

/** A replacement starts with the old amount only when it is measured in the same unit. */
export function initialReplacementAmount(
	oldUnit: Unit,
	newUnit: Unit,
	oldAmount: number
): number | null {
	return oldUnit === newUnit ? oldAmount : null;
}

/**
 * The amount of `ingredient` that gives `oldKcal`: whole grams/millilitres, pieces to one decimal,
 * at least one step.
 * `null` when it cannot be matched (nothing to match, or the ingredient has no kcal).
 */
export function matchKcalAmount(oldKcal: number, ingredient: IngredientValues): number | null {
	const kcalPerUnit = itemNutrition(ingredient, 1).kcal;
	if (oldKcal <= 0 || kcalPerUnit <= 0) return null;
	// The smallest step stands in for amounts that would round to zero.
	const perStep = ingredient.unit === 'pcs' ? 10 : 1;
	return Math.max(1, Math.round((oldKcal / kcalPerUnit) * perStep)) / perStep;
}
