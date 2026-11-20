import { and, asc, eq, isNull, like, ne, type SQL } from 'drizzle-orm';
import type { CategoryKey } from '$lib/config/categories';
import type { Unit } from '$lib/config/units';
import type { Ingredient, IngredientCreate, IngredientUpdate } from '$lib/schemas/ingredient';
import { db } from '$lib/server/db';
import { toNum } from '$lib/server/db/decimal';
import { ingredients } from '$lib/server/db/schema';

type Row = typeof ingredients.$inferSelect;

function toIngredient(row: Row): Ingredient {
	return {
		id: row.id,
		name: row.name,
		// The schema validates these on write, so the stored strings are config keys.
		unit: row.unit as Unit,
		category: row.category as CategoryKey,
		kcal: toNum(row.kcal),
		protein: toNum(row.protein),
		fat: toNum(row.fat),
		carbs: toNum(row.carbs),
		hidden: row.hiddenAt !== null
	};
}

/** `LIKE %q%` with `\`, `%` and `_` escaped. The name collation makes it case-insensitive. */
function nameContains(q: string): SQL {
	return like(ingredients.name, `%${q.replace(/[\\%_]/g, '\\$&')}%`);
}

const visible = isNull(ingredients.hiddenAt);

function nutritionValues(data: IngredientUpdate) {
	return {
		name: data.name,
		category: data.category,
		kcal: String(data.kcal),
		protein: String(data.protein),
		fat: String(data.fat),
		carbs: String(data.carbs)
	};
}

/** Visible ingredients sorted by name, optionally filtered by a name fragment. */
export async function listIngredients(q?: string): Promise<Ingredient[]> {
	const query = q?.trim();
	const rows = await db
		.select()
		.from(ingredients)
		.where(query ? and(visible, nameContains(query)) : visible)
		.orderBy(asc(ingredients.name));
	return rows.map(toIngredient);
}

/** Visible ingredients whose name contains `q`, for pickers. */
export async function searchIngredients(q: string, limit = 20): Promise<Ingredient[]> {
	const rows = await db
		.select()
		.from(ingredients)
		.where(and(visible, nameContains(q.trim())))
		.orderBy(asc(ingredients.name))
		.limit(limit);
	return rows.map(toIngredient);
}

/** Any ingredient by id, hidden ones included (they still join from meals and plans). */
export async function getIngredient(id: number): Promise<Ingredient | null> {
	const [row] = await db.select().from(ingredients).where(eq(ingredients.id, id)).limit(1);
	return row ? toIngredient(row) : null;
}

export async function createIngredient(data: IngredientCreate): Promise<number> {
	const [result] = await db
		.insert(ingredients)
		.values({ ...nutritionValues(data), unit: data.unit })
		.$returningId();
	return result.id;
}

/** Updates everything except the unit, which is immutable after creation. */
export async function updateIngredient(id: number, data: IngredientUpdate): Promise<void> {
	await db.update(ingredients).set(nutritionValues(data)).where(eq(ingredients.id, id));
}

/** Ingredients are never deleted; hiding removes them from the list, search and pickers. */
export async function hideIngredient(id: number): Promise<void> {
	await db
		.update(ingredients)
		.set({ hiddenAt: new Date() })
		.where(and(eq(ingredients.id, id), visible));
}

/** True if a visible ingredient has this name (case-insensitive via the collation). */
export async function visibleNameExists(name: string, exceptId?: number): Promise<boolean> {
	const conditions = [visible, eq(ingredients.name, name.trim())];
	if (exceptId !== undefined) conditions.push(ne(ingredients.id, exceptId));
	const [row] = await db
		.select({ id: ingredients.id })
		.from(ingredients)
		.where(and(...conditions))
		.limit(1);
	return row !== undefined;
}
