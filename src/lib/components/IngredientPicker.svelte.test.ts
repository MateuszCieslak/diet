import { render } from 'vitest-browser-svelte';
import type { Ingredient } from '$lib/schemas/ingredient';
import IngredientPicker from './IngredientPicker.svelte';

const egg: Ingredient = {
	id: 5,
	name: 'Jajko',
	unit: 'pcs',
	category: 'dairy',
	kcal: 78,
	protein: 6.3,
	fat: 5.3,
	carbs: 0.6,
	hidden: false
};

afterEach(() => {
	vi.restoreAllMocks();
});

test('IngredientPicker searches from the second character and offers the results', async () => {
	const fetchMock = vi
		.spyOn(globalThis, 'fetch')
		.mockImplementation(async () => Response.json({ items: [egg], nextCursor: null }));
	const onPick = vi.fn<(ingredient: Ingredient) => void>();
	const screen = render(IngredientPicker, { onPick });
	const input = screen.getByRole('searchbox');
	await input.fill('j');
	await new Promise((r) => setTimeout(r, 450));
	expect(fetchMock).not.toHaveBeenCalled();
	await input.fill('ja');
	await screen.getByRole('button', { name: /Jajko/ }).click();
	expect(fetchMock.mock.calls[0]).toEqual(['/api/ingredients?q=ja', expect.anything()]);
	expect(onPick).toHaveBeenCalledWith(egg);
});
