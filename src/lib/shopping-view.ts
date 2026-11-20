import { categories, type CategoryKey } from '$lib/config/categories';
import type { Unit } from '$lib/config/units';

/**
 * One row of the shopping list as the page shows it. For items built from the plan the name, unit
 * and category come from the ingredient; manual items have no category.
 */
export type ShoppingItemView = {
	id: number;
	name: string;
	unit: Unit | null;
	amount: number | null;
	category: CategoryKey | null;
	manual: boolean;
	done: boolean;
};

export type ShoppingGroup = { key: CategoryKey | 'other'; items: ShoppingItemView[] };

const collator = new Intl.Collator('pl');
const byName = (a: ShoppingItemView, b: ShoppingItemView) => collator.compare(a.name, b.name);

/**
 * Splits the list into open items grouped by category (in `categories` order, manual items under
 * `'other'`, empty groups omitted) and done items. Items are sorted by name with Polish collation.
 */
export function groupShoppingItems(items: ShoppingItemView[]): {
	open: ShoppingGroup[];
	done: ShoppingItemView[];
} {
	const groups = new Map<CategoryKey, ShoppingItemView[]>();
	const done: ShoppingItemView[] = [];
	for (const item of items) {
		if (item.done) {
			done.push(item);
			continue;
		}
		const key = item.manual ? 'other' : (item.category ?? 'other');
		const group = groups.get(key);
		if (group) group.push(item);
		else groups.set(key, [item]);
	}
	const open = categories
		.filter((key) => groups.has(key))
		.map((key) => ({ key, items: (groups.get(key) ?? []).toSorted(byName) }));
	return { open, done: done.toSorted(byName) };
}
