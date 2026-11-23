import { render } from 'vitest-browser-svelte';
import type { Ingredient } from '$lib/schemas/ingredient';
import IngredientList from './IngredientList.svelte';

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
const initial = { q: '', page: { items: [egg], nextCursor: null } };

afterEach(() => {
	vi.restoreAllMocks();
});

test('IngredientList links each ingredient to its edit page and has no search button', async () => {
	const screen = render(IngredientList, { initial });
	await expect
		.element(screen.getByRole('link', { name: /Jajko/ }))
		.toHaveAttribute('href', '/ingredients/5/edit');
	expect(screen.getByRole('button', { name: 'Szukaj' }).elements()).toHaveLength(0);
});

test('IngredientList searches while typing, from the second character', async () => {
	const fetchMock = vi
		.spyOn(globalThis, 'fetch')
		.mockImplementation(async () => Response.json({ items: [], nextCursor: null }));
	const screen = render(IngredientList, { initial });
	const input = screen.getByRole('searchbox');
	await input.fill('j');
	await new Promise((r) => setTimeout(r, 450));
	expect(fetchMock).not.toHaveBeenCalled();
	await input.fill('ja');
	await expect.poll(() => fetchMock.mock.calls.length).toBe(1);
	expect(fetchMock.mock.calls[0]).toEqual(['/api/ingredients?q=ja', expect.anything()]);
	await expect
		.element(screen.getByText('Brak składników pasujących do wyszukiwania.'))
		.toBeVisible();
});
