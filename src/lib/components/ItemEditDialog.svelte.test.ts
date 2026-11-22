import { render } from 'vitest-browser-svelte';
import type { Ingredient } from '$lib/schemas/ingredient';
import type { MealItem } from '$lib/schemas/meal';
import ItemEditDialog from './ItemEditDialog.svelte';

const base = { category: 'grains', protein: 10, fat: 5, carbs: 60, hidden: false } as const;
const oats: Ingredient = { ...base, id: 1, name: 'Płatki owsiane', unit: 'g', kcal: 366 };
const rice: Ingredient = { ...base, id: 2, name: 'Ryż basmati', unit: 'g', kcal: 350 };
const egg: Ingredient = { ...base, id: 3, name: 'Jajko', unit: 'pcs', kcal: 78 };

afterEach(() => {
	vi.restoreAllMocks();
});

/** The picker searches `/api/ingredients`; answer every search with `results`. */
function mockSearch(results: Ingredient[]) {
	vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json(results));
}

async function replaceWith(screen: ReturnType<typeof render>, ingredient: Ingredient) {
	mockSearch([ingredient]);
	await screen.getByRole('searchbox').fill(ingredient.name.slice(0, 3));
	await screen.getByRole('button', { name: new RegExp(ingredient.name) }).click();
}

test('replacing shows before and after; match kcal fills the amount', async () => {
	const item: MealItem = { ingredient: oats, amount: 50 }; // 183 kcal
	const screen = render(ItemEditDialog, { open: true, item, onApply: () => {} });
	await replaceWith(screen, rice);

	const before = screen.getByRole('row', { name: /Było/ });
	const after = screen.getByRole('row', { name: /Będzie/ });
	await expect.element(before).toHaveTextContent('183');
	await expect.element(after).toHaveTextContent('175'); // 50 g of rice
	await screen.getByRole('button', { name: 'Dopasuj kcal' }).click();
	await expect.element(screen.getByRole('textbox', { name: 'Ilość' })).toHaveValue('52');
	await expect.element(after).toHaveTextContent('182');
});

test('a replacement in another unit starts without an amount', async () => {
	const screen = render(ItemEditDialog, {
		open: true,
		item: { ingredient: oats, amount: 50 },
		onApply: () => {}
	});
	await replaceWith(screen, egg);
	await expect.element(screen.getByRole('textbox', { name: 'Ilość' })).toHaveValue('');
	await expect.element(screen.getByRole('button', { name: 'Zastosuj' })).toBeDisabled();
});

test('match kcal is disabled for an ingredient without kcal', async () => {
	const water: Ingredient = { ...base, id: 4, name: 'Woda', unit: 'ml', kcal: 0 };
	const screen = render(ItemEditDialog, {
		open: true,
		item: { ingredient: oats, amount: 50 },
		onApply: () => {}
	});
	await replaceWith(screen, water);
	await expect.element(screen.getByRole('button', { name: 'Dopasuj kcal' })).toBeDisabled();
});

test('apply is disabled while the amount is invalid, then applies the edit', async () => {
	const onApply = vi.fn<(item: MealItem) => void>();
	const screen = render(ItemEditDialog, {
		open: true,
		item: { ingredient: oats, amount: 50 },
		onApply
	});
	const amount = screen.getByRole('textbox', { name: 'Ilość' });
	const apply = screen.getByRole('button', { name: 'Zastosuj' });
	await amount.fill('1,');
	await expect.element(apply).toBeDisabled();
	await amount.fill('60');
	await apply.click();
	expect(onApply).toHaveBeenCalledWith({ ingredient: oats, amount: 60 });
});
