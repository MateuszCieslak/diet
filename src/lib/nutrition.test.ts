import type { User } from '$lib/config/users';
import {
	dayEatenKcal,
	dayTotals,
	formatAmount,
	formatKcal,
	formatMacro,
	itemNutrition,
	planMealPerUser,
	zeroNutrition
} from './nutrition';

const egg = { unit: 'pcs', kcal: 70, protein: 6, fat: 5, carbs: 0.5 } as const;
const rice = { unit: 'g', kcal: 130, protein: 2.7, fat: 0.3, carbs: 28 } as const;
const users: User[] = [
	{ key: 'a', name: 'A', multiplier: 1, color: '#000000', tint: '#FFFFFF' },
	{ key: 'b', name: 'B', multiplier: 1.5, color: '#000000', tint: '#FFFFFF' }
];

test('per-piece and per-100 units', () => {
	expect(itemNutrition(egg, 2)).toEqual({ kcal: 140, protein: 12, fat: 10, carbs: 1 });
	expect(itemNutrition(rice, 150).kcal).toBeCloseTo(195);
});
test('per user with exclusions and day totals', () => {
	const meal = { items: [{ ingredient: egg, amount: 2 }], excludedUserKeys: ['b'] };
	expect(planMealPerUser(meal, users)).toEqual({
		a: { kcal: 140, protein: 12, fat: 10, carbs: 1 },
		b: null
	});
	const both = { items: [{ ingredient: egg, amount: 2 }], excludedUserKeys: [] };
	expect(dayTotals([meal, both], users).b.kcal).toBeCloseTo(210);
	expect(dayTotals([], users).a).toEqual(zeroNutrition);
});
test('dayEatenKcal sums only meals the user ate, with their multiplier', () => {
	const items = [{ ingredient: egg, amount: 2 }]; // 140 kcal base
	const meals = [
		{ items, excludedUserKeys: [], eatenUserKeys: ['a', 'b'] },
		{ items, excludedUserKeys: [], eatenUserKeys: ['a'] },
		// A stale mark for an excluded user is ignored.
		{ items, excludedUserKeys: ['b'], eatenUserKeys: ['b'] }
	];
	expect(dayEatenKcal(meals, users)).toEqual({ a: 280, b: 210 });
	expect(dayEatenKcal([], users)).toEqual({ a: 0, b: 0 });
});
test('formatting', () => {
	expect(formatKcal(194.6)).toBe('195');
	expect(formatMacro(12.345)).toBe('12,3');
	expect(formatAmount(150.4, 'g')).toBe('150');
	expect(formatAmount(1.25, 'pcs')).toBe('1,3');
	expect(formatAmount(2, 'pcs')).toBe('2');
});
