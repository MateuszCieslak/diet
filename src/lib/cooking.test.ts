import type { User } from '$lib/config/users';
import type { Ingredient } from '$lib/schemas/ingredient';
import { cookingTable } from './cooking';

const u: User[] = [
	{ key: 'a', name: 'A', multiplier: 1, color: '#000000', tint: '#FFFFFF' },
	{ key: 'b', name: 'B', multiplier: 1.2, color: '#000000', tint: '#FFFFFF' }
];
const garlic = {
	id: 1,
	name: 'Czosnek',
	unit: 'pcs',
	kcal: 4,
	protein: 0,
	fat: 0,
	carbs: 1
} as Ingredient;
const rice = {
	id: 2,
	name: 'Ryż',
	unit: 'g',
	kcal: 350,
	protein: 8,
	fat: 1,
	carbs: 78
} as Ingredient;

test('one column per included user with multiplied amounts', () => {
	const t = cookingTable(
		{
			items: [
				{ ingredient: rice, amount: 70 },
				{ ingredient: garlic, amount: 1 }
			],
			excludedUserKeys: []
		},
		u
	);
	expect(t.columns.map((c) => c.key)).toEqual(['a', 'b']);
	expect(t.rows).toEqual([
		{ name: 'Ryż', amounts: ['70 g', '84 g'], total: '154 g' },
		{ name: 'Czosnek', amounts: ['1 szt.', '1,2 szt.'], total: '2,2 szt.' }
	]);
	expect(t.kcal).toEqual(['249', '299']); // 249 × 1.2 = 298.8 → rounds to 299
	expect(t.totalKcal).toBe('548'); // 249 × 2.2 = 547.8
});

test('the total counts only users who eat the meal', () => {
	const t = cookingTable({ items: [{ ingredient: rice, amount: 70 }], excludedUserKeys: ['a'] }, u);
	expect(t.rows[0].total).toBe('84 g');
	expect(t.totalKcal).toBe('294'); // 245 × 1.2
});

test('excluded users get no column; all excluded gives no columns', () => {
	const meal = { items: [{ ingredient: rice, amount: 70 }], excludedUserKeys: ['a'] };
	expect(cookingTable(meal, u).columns.map((c) => c.key)).toEqual(['b']);
	expect(cookingTable({ ...meal, excludedUserKeys: ['a', 'b'] }, u).columns).toEqual([]);
});

test('a portion multiplier scales amounts and the total, not kcal per portion', () => {
	const meal = { items: [{ ingredient: rice, amount: 70 }], excludedUserKeys: [] };
	const t = cookingTable(meal, u, 2);
	expect(t.rows[0]).toEqual({ name: 'Ryż', amounts: ['140 g', '168 g'], total: '308 g' });
	expect(t.kcal).toEqual(['245', '294']);
	expect(t.totalKcal).toBe('539');
});

test('the portion count multiplies amounts and kcal per person', () => {
	const meal = { items: [{ ingredient: rice, amount: 70 }], excludedUserKeys: [], portions: 2 };
	const t = cookingTable(meal, u);
	expect(t.rows[0].amounts).toEqual(['140 g', '168 g']);
	expect(t.kcal).toEqual(['490', '588']);
});
