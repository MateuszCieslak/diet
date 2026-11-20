import { render } from 'vitest-browser-svelte';
import NutritionTable from './NutritionTable.svelte';

test('NutritionTable shows each user and a dash for excluded', async () => {
	const screen = render(NutritionTable, {
		perUser: { user1: { kcal: 140, protein: 12, fat: 10, carbs: 1 }, user2: null }
	});
	await expect.element(screen.getByText('140')).toBeVisible();
	await expect.element(screen.getByText('—')).toBeVisible();
});
