import type { User } from '$lib/config/users';
import { pl } from '$lib/i18n/pl';
import { formatAmount, formatKcal, planMealPerUser } from '$lib/nutrition';
import type { PlanMeal } from '$lib/plan';

/**
 * Ingredient amounts and kcal per portion, one column per person who eats the meal, plus the
 * total for cooking all those portions at once.
 */
export type CookingTable = {
	columns: User[];
	rows: { name: string; amounts: string[]; total: string }[];
	kcal: string[];
	totalKcal: string;
	/** Label of the kcal row: per portion, or for the meal's portion count when it is not 1. */
	kcalLabel: string;
};

/**
 * Columns follow config order and skip excluded people; rows keep the meal's item order.
 * The meal's `portions` scale amounts and kcal (what each person eats). `portionMultiplier`, the
 * device-only calculator, scales the amounts only (e.g. cooking for two days).
 */
export function cookingTable(
	meal: Pick<PlanMeal, 'items' | 'excludedUserKeys'> & { portions?: number },
	users: readonly User[],
	portionMultiplier = 1
): CookingTable {
	const columns = users.filter((u) => !meal.excludedUserKeys.includes(u.key));
	const perUser = planMealPerUser(meal, columns);
	const totalMultiplier = columns.reduce((sum, u) => sum + u.multiplier, 0);
	// The meal's stored portions and the device-only calculator both scale the amounts.
	const scale = (meal.portions ?? 1) * portionMultiplier;
	return {
		columns,
		rows: meal.items.map(({ ingredient, amount }) => {
			const format = (n: number) =>
				`${formatAmount(n, ingredient.unit)} ${pl.units[ingredient.unit]}`;
			return {
				name: ingredient.name,
				amounts: columns.map((u) => format(amount * u.multiplier * scale)),
				total: format(amount * totalMultiplier * scale)
			};
		}),
		kcal: columns.map((u) => formatKcal(perUser[u.key]?.kcal ?? 0)),
		totalKcal: formatKcal(columns.reduce((sum, u) => sum + (perUser[u.key]?.kcal ?? 0), 0)),
		kcalLabel:
			(meal.portions ?? 1) === 1
				? pl.cooking.kcalPerPortion
				: pl.cooking.kcalForPortions(pl.plan.portions(meal.portions ?? 1))
	};
}
