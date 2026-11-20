import { groupShoppingItems, type ShoppingItemView } from './shopping-view';

const v = (
	id: number,
	name: string,
	category: ShoppingItemView['category'],
	manual = false,
	done = false
): ShoppingItemView => ({ id, name, unit: null, amount: null, category, manual, done });

test('groups by category order, manual last, sorted with Polish collation', () => {
	const out = groupShoppingItems([
		v(1, 'Śliwki', 'fruit'),
		v(2, 'Banany', 'fruit'),
		v(3, 'Marchew', 'vegetables'),
		v(4, 'Zapałki', null, true),
		v(5, 'Mleko', 'dairy', false, true)
	]);
	expect(out.open.map((g) => g.key)).toEqual(['vegetables', 'fruit', 'other']);
	expect(out.open[1].items.map((i) => i.name)).toEqual(['Banany', 'Śliwki']);
	expect(out.done.map((i) => i.id)).toEqual([5]);
});

test('manual items share the other group and done items are sorted by name', () => {
	const out = groupShoppingItems([
		v(1, 'Zapałki', null, true),
		v(2, 'Folia', 'other'),
		v(3, 'Żurek', 'drinks', false, true),
		v(4, 'Ćwikła', 'vegetables', false, true),
		v(5, 'Cebula', 'vegetables', false, true)
	]);
	expect(out.open).toEqual([
		{ key: 'other', items: [v(2, 'Folia', 'other'), v(1, 'Zapałki', null, true)] }
	]);
	expect(out.done.map((i) => i.name)).toEqual(['Cebula', 'Ćwikła', 'Żurek']);
});
