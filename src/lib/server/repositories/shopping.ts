import { eq, gte, max } from 'drizzle-orm';
import type { ExistingItem, ListCreation } from '$lib/shopping';
import { db } from '$lib/server/db';
import { toNumOrNull } from '$lib/server/db/decimal';
import { planMeals, shoppingListItems } from '$lib/server/db/schema';

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
