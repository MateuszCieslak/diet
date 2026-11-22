import { render } from 'vitest-browser-svelte';
import NutritionTable from './NutritionTable.svelte';

test('NutritionTable shows each user and a dash for excluded', async () => {
	const screen = render(NutritionTable, {
		perUser: { user1: { kcal: 140, protein: 12, fat: 10, carbs: 1 }, user2: null }
	});
	await expect.element(screen.getByText('140')).toBeVisible();
	await expect.element(screen.getByText('—')).toBeVisible();
});

test('NutritionTable shows eaten of planned kcal when eatenKcal is given', async () => {
	const screen = render(NutritionTable, {
		perUser: { user1: { kcal: 1610, protein: 100, fat: 50, carbs: 190 }, user2: null },
		eatenKcal: { user1: 820, user2: 0 }
	});
	await expect.element(screen.getByText(/820\s*\/\s*1\s?610/)).toBeVisible();
});
