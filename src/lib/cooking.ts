import type { User } from '$lib/config/users';
import { pl } from '$lib/i18n/pl';
import { formatAmount, formatKcal, planMealPerUser } from '$lib/nutrition';
import type { PlanMeal } from '$lib/plan';

/** Ingredient amounts and kcal per portion, one column per person who eats the meal. */
export type CookingTable = {
	columns: User[];
	rows: { name: string; amounts: string[] }[];
	kcal: string[];
};

/** Columns follow config order and skip excluded people; rows keep the meal's item order. */
export function cookingTable(
	meal: Pick<PlanMeal, 'items' | 'excludedUserKeys'>,
	users: readonly User[]
): CookingTable {
	const columns = users.filter((u) => !meal.excludedUserKeys.includes(u.key));
	const perUser = planMealPerUser(meal, columns);
	return {
		columns,
		rows: meal.items.map(({ ingredient, amount }) => ({
			name: ingredient.name,
			amounts: columns.map(
				(u) =>
					`${formatAmount(amount * u.multiplier, ingredient.unit)} ${pl.units[ingredient.unit]}`
			)
		})),
		kcal: columns.map((u) => formatKcal(perUser[u.key]?.kcal ?? 0))
	};
}
