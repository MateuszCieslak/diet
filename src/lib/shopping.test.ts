import type { User } from '$lib/config/users';
import type { Ingredient } from '$lib/schemas/ingredient';
import { addIngredientAmount, buildFromPlan, planListCreation } from './shopping';

const users: User[] = [
	{ key: 'a', name: 'A', multiplier: 1, color: '', tint: '' },
	{ key: 'b', name: 'B', multiplier: 1.5, color: '', tint: '' }
];
const ing = (id: number, unit = 'g') => ({ id, unit }) as Ingredient;

test('buildFromPlan sums per ingredient with multipliers and exclusions', () => {
	const meals = [
		{
			items: [
				{ ingredient: ing(2, 'pcs'), amount: 2 },
				{ ingredient: ing(1), amount: 100 }
			],
			excludedUserKeys: []
		},
		{ items: [{ ingredient: ing(1), amount: 50 }], excludedUserKeys: ['b'] }
	];
	expect(buildFromPlan(meals, users)).toEqual([
		{ ingredientId: 1, amount: 300 },
		{ ingredientId: 2, amount: 5 }
	]);
});

test('meal with all users excluded adds nothing', () => {
	const meals = [{ items: [{ ingredient: ing(3), amount: 100 }], excludedUserKeys: ['a', 'b'] }];
	expect(buildFromPlan(meals, users)).toEqual([]);
});

test('buildFromPlan rounds to 2 decimals', () => {
	const meals = [
		{ items: [{ ingredient: ing(1), amount: 0.1 }], excludedUserKeys: ['b'] },
		{ items: [{ ingredient: ing(1), amount: 0.2 }], excludedUserKeys: ['b'] }
	];
	expect(buildFromPlan(meals, users)).toEqual([{ ingredientId: 1, amount: 0.3 }]);
});

test('planListCreation', () => {
	const built = [
		{ ingredientId: 1, amount: 100 },
		{ ingredientId: 9, amount: 1 }
	];
	expect(planListCreation([], built)).toEqual({ kind: 'rebuild', insert: built });
	const allDone = [{ id: 5, ingredientId: 1, amount: 10, done: true }];
	expect(planListCreation(allDone, built)).toEqual({ kind: 'rebuild', insert: built });
	const open = [
		{ id: 1, ingredientId: 1, amount: 50, done: false },
		{ id: 2, ingredientId: 9, amount: 3, done: true },
		{ id: 3, ingredientId: null, amount: null, done: false }
	];
	expect(planListCreation(open, built)).toEqual({ kind: 'needs-mode' });
	expect(planListCreation(open, built, 'replace')).toEqual({ kind: 'rebuild', insert: built });
	expect(planListCreation(open, built, 'merge')).toEqual({
		kind: 'merge',
		updates: [{ id: 1, amount: 150 }],
		insert: [{ ingredientId: 9, amount: 1 }]
	});
});

test('merge into an open item without an amount counts it as 0', () => {
	const open = [{ id: 4, ingredientId: 1, amount: null, done: false }];
	expect(planListCreation(open, [{ ingredientId: 1, amount: 2.5 }], 'merge')).toEqual({
		kind: 'merge',
		updates: [{ id: 4, amount: 2.5 }],
		insert: []
	});
});

test('addIngredientAmount', () => {
	expect(addIngredientAmount(null, null)).toBeNull();
	expect(addIngredientAmount(null, 2)).toBe(2);
	expect(addIngredientAmount(150, null)).toBe(150);
	expect(addIngredientAmount(0.1, 0.2)).toBe(0.3);
});
