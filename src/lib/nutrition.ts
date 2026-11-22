import type { Unit } from '$lib/config/units';
import type { User } from '$lib/config/users';

export type Nutrition = { kcal: number; protein: number; fat: number; carbs: number };
/** An ingredient's values: per 100 g / 100 ml, or per 1 piece for `pcs`. */
export type IngredientValues = Nutrition & { unit: Unit };
export type CalcItem = { ingredient: IngredientValues; amount: number };
export type CalcPlanMeal = { items: CalcItem[]; excludedUserKeys: string[] };

export const zeroNutrition: Nutrition = Object.freeze({ kcal: 0, protein: 0, fat: 0, carbs: 0 });

function scale(n: Nutrition, factor: number): Nutrition {
	return {
		kcal: n.kcal * factor,
		protein: n.protein * factor,
		fat: n.fat * factor,
		carbs: n.carbs * factor
	};
}

export function itemNutrition(ing: IngredientValues, amount: number): Nutrition {
	return scale(ing, ing.unit === 'pcs' ? amount : amount / 100);
}

export function sumNutrition(list: Nutrition[]): Nutrition {
	return list.reduce(
		(acc, n) => ({
			kcal: acc.kcal + n.kcal,
			protein: acc.protein + n.protein,
			fat: acc.fat + n.fat,
			carbs: acc.carbs + n.carbs
		}),
		zeroNutrition
	);
}

/** Base nutrition of a meal: one average portion. */
export function mealNutrition(items: CalcItem[]): Nutrition {
	return sumNutrition(items.map((i) => itemNutrition(i.ingredient, i.amount)));
}

export function forUser(n: Nutrition, multiplier: number): Nutrition {
	return scale(n, multiplier);
}

/** Per-user nutrition of a planned meal; `null` for excluded users. */
export function planMealPerUser(
	meal: CalcPlanMeal,
	users: readonly User[]
): Record<string, Nutrition | null> {
	const base = mealNutrition(meal.items);
	return Object.fromEntries(
		users.map((u) => [
			u.key,
			meal.excludedUserKeys.includes(u.key) ? null : forUser(base, u.multiplier)
		])
	);
}

/** Per-user sums for a day, skipping meals the user is excluded from. */
export function dayTotals(
	meals: CalcPlanMeal[],
	users: readonly User[]
): Record<string, Nutrition> {
	const perMeal = meals.map((m) => planMealPerUser(m, users));
	return Object.fromEntries(
		users.map((u) => [
			u.key,
			sumNutrition(perMeal.map((p) => p[u.key]).filter((n): n is Nutrition => n !== null))
		])
	);
}

/** Per-user kcal of the day's meals they marked as eaten; excluded meals never count. */
export function dayEatenKcal(
	meals: (CalcPlanMeal & { eatenUserKeys: string[] })[],
	users: readonly User[]
): Record<string, number> {
	const perMeal = meals.map((m) => ({
		eaten: m.eatenUserKeys,
		perUser: planMealPerUser(m, users)
	}));
	return Object.fromEntries(
		users.map((u) => [
			u.key,
			perMeal.reduce(
				(sum, m) => sum + (m.eaten.includes(u.key) ? (m.perUser[u.key]?.kcal ?? 0) : 0),
				0
			)
		])
	);
}

const integerFormat = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const oneDecimalFormat = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });
const fixedOneDecimalFormat = new Intl.NumberFormat('pl-PL', {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});

export function formatKcal(n: number): string {
	return integerFormat.format(n);
}

export function formatMacro(n: number): string {
	return fixedOneDecimalFormat.format(n);
}

/** Shopping/recipe amount: integer for `g`/`ml`, at most 1 decimal for `pcs`. */
export function formatAmount(n: number, unit: Unit): string {
	return (unit === 'pcs' ? oneDecimalFormat : integerFormat).format(n);
}
