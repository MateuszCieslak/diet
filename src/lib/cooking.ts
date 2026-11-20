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
};

/** Columns follow config order and skip excluded people; rows keep the meal's item order. */
export function cookingTable(
	meal: Pick<PlanMeal, 'items' | 'excludedUserKeys'>,
	users: readonly User[]
): CookingTable {
	const columns = users.filter((u) => !meal.excludedUserKeys.includes(u.key));
	const perUser = planMealPerUser(meal, columns);
	const totalMultiplier = columns.reduce((sum, u) => sum + u.multiplier, 0);
	return {
		columns,
		rows: meal.items.map(({ ingredient, amount }) => {
			const format = (n: number) =>
				`${formatAmount(n, ingredient.unit)} ${pl.units[ingredient.unit]}`;
			return {
				name: ingredient.name,
				amounts: columns.map((u) => format(amount * u.multiplier)),
				total: format(amount * totalMultiplier)
			};
		}),
		kcal: columns.map((u) => formatKcal(perUser[u.key]?.kcal ?? 0)),
		totalKcal: formatKcal(columns.reduce((sum, u) => sum + (perUser[u.key]?.kcal ?? 0), 0))
	};
}
