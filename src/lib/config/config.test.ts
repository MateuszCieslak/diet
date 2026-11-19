import { users } from './users';
import { categories } from './categories';
import { mealTypes } from './meal-types';
import { pl } from '$lib/i18n/pl';

test('user keys are unique and multipliers positive', () => {
	expect(new Set(users.map((u) => u.key)).size).toBe(users.length);
	for (const u of users) expect(u.multiplier).toBeGreaterThan(0);
});
test('every category and meal type has a Polish label', () => {
	for (const c of categories) expect(pl.categories[c]).toBeTruthy();
	for (const t of mealTypes) expect(pl.mealTypes[t]).toBeTruthy();
	expect(pl.mealTypes.second_breakfast).toBe('Drugie śniadanie');
});
test('every user has a color and tint in hex', () => {
	for (const u of users) {
		expect(u.color).toMatch(/^#[0-9A-F]{6}$/i);
		expect(u.tint).toMatch(/^#[0-9A-F]{6}$/i);
	}
});
