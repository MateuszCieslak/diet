import { render } from 'vitest-browser-svelte';
import type { MealListItem } from '$lib/schemas/meal';
import MealPicker from './MealPicker.svelte';

const meal: MealListItem = {
	id: 3,
	name: 'Owsianka',
	photo: null,
	types: ['breakfast'],
	base: { kcal: 412.4, protein: 12, fat: 8, carbs: 60 }
};
const initial = { q: '', page: { items: [meal], nextCursor: null } };

test('MealPicker without onPick links each meal to its page', async () => {
	const screen = render(MealPicker, { initial });
	await expect
		.element(screen.getByRole('link', { name: /Owsianka/ }))
		.toHaveAttribute('href', '/meals/3');
	await expect.element(screen.getByText('412 kcal / porcja')).toBeVisible();
});

test('MealPicker with onPick calls it with the tapped meal', async () => {
	const onPick = vi.fn<(meal: MealListItem) => void>();
	const screen = render(MealPicker, { initial, onPick });
	await screen.getByRole('button', { name: /Owsianka/ }).click();
	expect(onPick).toHaveBeenCalledWith(meal);
});
