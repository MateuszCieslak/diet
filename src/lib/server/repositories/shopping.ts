import { eq, gte, max } from 'drizzle-orm';
import type { CategoryKey } from '$lib/config/categories';
import type { Unit } from '$lib/config/units';
import type { ItemPatch, ManualItemInput } from '$lib/schemas/shopping';
import type { ExistingItem, ListCreation } from '$lib/shopping';
import type { ShoppingItemView } from '$lib/shopping-view';
import { db } from '$lib/server/db';
import { toNumOrNull } from '$lib/server/db/decimal';
import { ingredients, planMeals, shoppingListItems } from '$lib/server/db/schema';

/** The last date on or after `from` that has a planned meal, or `null` if there is none. */
export async function getLastPlannedDate(from: string): Promise<string | null> {
	const [row] = await db
		.select({ date: max(planMeals.date) })
		.from(planMeals)
		.where(gte(planMeals.date, from));
	return row?.date ?? null;
}

export async function getExistingItems(): Promise<ExistingItem[]> {
	const rows = await db
		.select({
			id: shoppingListItems.id,
			ingredientId: shoppingListItems.ingredientId,
			amount: shoppingListItems.amount,
			doneAt: shoppingListItems.doneAt
		})
		.from(shoppingListItems);
	return rows.map((r) => ({
		id: r.id,
		ingredientId: r.ingredientId,
		amount: toNumOrNull(r.amount),
		done: r.doneAt !== null
	}));
}

/** Writes a list built from the plan in one transaction. `rebuild` deletes all items first. */
export async function applyListCreation(
	plan: Exclude<ListCreation, { kind: 'needs-mode' }>
): Promise<void> {
	await db.transaction(async (tx) => {
		if (plan.kind === 'rebuild') {
			await tx.delete(shoppingListItems);
		} else {
			for (const { id, amount } of plan.updates) {
				await tx
					.update(shoppingListItems)
					.set({ amount: String(amount) })
					.where(eq(shoppingListItems.id, id));
			}
		}
		if (plan.insert.length > 0) {
			await tx.insert(shoppingListItems).values(
				plan.insert.map((item) => ({
					ingredientId: item.ingredientId,
					amount: String(item.amount)
				}))
			);
		}
	});
}

/** Thrown by `patchItem` when clearing the amount of an item built from the plan. */
export class AmountRequiredError extends Error {
	constructor() {
		super('Only manual items can have no amount');
	}
}

function selectItemViews() {
	return db
		.select({
			id: shoppingListItems.id,
			ingredientId: shoppingListItems.ingredientId,
			itemName: shoppingListItems.name,
			itemUnit: shoppingListItems.unit,
			amount: shoppingListItems.amount,
			doneAt: shoppingListItems.doneAt,
			ingredientName: ingredients.name,
			ingredientUnit: ingredients.unit,
			category: ingredients.category
		})
		.from(shoppingListItems)
		.leftJoin(ingredients, eq(shoppingListItems.ingredientId, ingredients.id));
}

type ItemViewRow = Awaited<ReturnType<typeof selectItemViews>>[number];

/** Plan items take their name, unit and category from the ingredient. */
function toItemView(r: ItemViewRow): ShoppingItemView {
	const manual = r.ingredientId === null;
	return {
		id: r.id,
		name: (manual ? r.itemName : r.ingredientName) ?? '',
		unit: ((manual ? r.itemUnit : r.ingredientUnit) as Unit | null) ?? null,
		amount: toNumOrNull(r.amount),
		category: manual ? null : ((r.category as CategoryKey | null) ?? null),
		manual,
		done: r.doneAt !== null
	};
}

async function getItemView(id: number): Promise<ShoppingItemView | null> {
	const [row] = await selectItemViews().where(eq(shoppingListItems.id, id));
	return row ? toItemView(row) : null;
}

/** The whole list, unsorted; the page groups and sorts it. */
export async function listShoppingItems(): Promise<ShoppingItemView[]> {
	return (await selectItemViews()).map(toItemView);
}

export async function addManualItem(data: ManualItemInput): Promise<ShoppingItemView> {
	const [{ id }] = await db
		.insert(shoppingListItems)
		.values({
			name: data.name,
			unit: data.unit ?? null,
			amount: data.amount === undefined ? null : String(data.amount)
		})
		.$returningId();
	const item = await getItemView(id);
	if (!item) throw new Error(`Shopping list item ${id} vanished after insert`);
	return item;
}

/**
 * Ticks or unticks an item (`done_at` becomes now or null) and/or changes its amount. Returns
 * `null` when the item does not exist. Throws `AmountRequiredError` when clearing the amount of an
 * item built from the plan.
 */
export async function patchItem(id: number, patch: ItemPatch): Promise<ShoppingItemView | null> {
	const [current] = await db
		.select({ ingredientId: shoppingListItems.ingredientId })
		.from(shoppingListItems)
		.where(eq(shoppingListItems.id, id));
	if (!current) return null;
	if (patch.amount === null && current.ingredientId !== null) throw new AmountRequiredError();

	const set: Partial<typeof shoppingListItems.$inferInsert> = {};
	if (patch.done !== undefined) set.doneAt = patch.done ? new Date() : null;
	if (patch.amount !== undefined) set.amount = patch.amount === null ? null : String(patch.amount);
	await db.update(shoppingListItems).set(set).where(eq(shoppingListItems.id, id));
	return getItemView(id);
}
