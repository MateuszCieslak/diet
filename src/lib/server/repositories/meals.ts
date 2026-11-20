import { and, asc, eq, exists, gt, like, or, type SQL } from 'drizzle-orm';
import { mealTypes, type MealTypeKey } from '$lib/config/meal-types';
import { mealNutrition } from '$lib/nutrition';
import type { MealDetail, MealInput, MealListPage } from '$lib/schemas/meal';
import { db } from '$lib/server/db';
import { toNum } from '$lib/server/db/decimal';
import { mealIngredients, mealTypeLinks, meals } from '$lib/server/db/schema';
import { encodeCursor, type Cursor } from '$lib/server/pagination';
import { toIngredient } from './ingredients';

export const mealsPageSize = 30;

type MealWrite = MealInput & { photo: string | null };
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Types in config order, so they read the same everywhere. */
function sortTypes(types: string[]): MealTypeKey[] {
	return mealTypes.filter((t) => types.includes(t));
}

async function insertTypesAndItems(tx: Tx, mealId: number, data: MealInput): Promise<void> {
	await tx.insert(mealTypeLinks).values(data.types.map((type) => ({ mealId, type })));
	await tx.insert(mealIngredients).values(
		data.items.map((item, position) => ({
			mealId,
			ingredientId: item.ingredientId,
			amount: String(item.amount),
			position
		}))
	);
}

/**
 * Meals sorted by name, keyset-paginated on `(name, id)`. Comparison and sorting both use the name
 * column's collation, so the cursor stays consistent with the order.
 */
export async function listMeals(opts: {
	q?: string;
	type?: MealTypeKey;
	cursor?: Cursor | null;
	limit?: number;
}): Promise<MealListPage> {
	const limit = opts.limit ?? mealsPageSize;
	const q = opts.q?.trim();
	const conditions: (SQL | undefined)[] = [];
	if (q) conditions.push(like(meals.name, `%${q.replace(/[\\%_]/g, '\\$&')}%`));
	if (opts.type) {
		conditions.push(
			exists(
				db
					.select({ one: mealTypeLinks.mealId })
					.from(mealTypeLinks)
					.where(and(eq(mealTypeLinks.mealId, meals.id), eq(mealTypeLinks.type, opts.type)))
			)
		);
	}
	if (opts.cursor) {
		const { name, id } = opts.cursor;
		conditions.push(or(gt(meals.name, name), and(eq(meals.name, name), gt(meals.id, id))));
	}
	const rows = await db.query.meals.findMany({
		where: and(...conditions),
		orderBy: [asc(meals.name), asc(meals.id)],
		// One extra row tells whether there is a next page.
		limit: limit + 1,
		with: { types: true, ingredients: { with: { ingredient: true } } }
	});
	const page = rows.slice(0, limit);
	const last = page.at(-1);
	return {
		items: page.map((row) => ({
			id: row.id,
			name: row.name,
			photo: row.photoPath,
			types: sortTypes(row.types.map((t) => t.type)),
			base: mealNutrition(
				row.ingredients.map((i) => ({
					ingredient: toIngredient(i.ingredient),
					amount: toNum(i.amount)
				}))
			)
		})),
		nextCursor: rows.length > limit && last ? encodeCursor(last) : null
	};
}

/** A meal with its types and ingredient rows (in form order); hidden ingredients included. */
export async function getMeal(id: number): Promise<MealDetail | null> {
	const row = await db.query.meals.findFirst({
		where: eq(meals.id, id),
		with: {
			types: true,
			ingredients: {
				orderBy: [asc(mealIngredients.position), asc(mealIngredients.id)],
				with: { ingredient: true }
			}
		}
	});
	if (!row) return null;
	return {
		id: row.id,
		name: row.name,
		photo: row.photoPath,
		preparation: row.preparation,
		types: sortTypes(row.types.map((t) => t.type)),
		items: row.ingredients.map((i) => ({
			ingredient: toIngredient(i.ingredient),
			amount: toNum(i.amount)
		}))
	};
}

/** Throws a duplicate-key error (see `isDuplicateKeyError`) if the name is taken. */
export async function createMeal(data: MealWrite): Promise<number> {
	return db.transaction(async (tx) => {
		const [result] = await tx
			.insert(meals)
			.values({ name: data.name, photoPath: data.photo, preparation: data.preparation ?? null })
			.$returningId();
		await insertTypesAndItems(tx, result.id, data);
		return result.id;
	});
}

/** Replaces the meal's fields, types and ingredient rows in one transaction. */
export async function updateMeal(id: number, data: MealWrite): Promise<void> {
	await db.transaction(async (tx) => {
		await tx
			.update(meals)
			.set({ name: data.name, photoPath: data.photo, preparation: data.preparation ?? null })
			.where(eq(meals.id, id));
		await tx.delete(mealTypeLinks).where(eq(mealTypeLinks.mealId, id));
		await tx.delete(mealIngredients).where(eq(mealIngredients.mealId, id));
		await insertTypesAndItems(tx, id, data);
	});
}

/** Hard delete: types and ingredient rows cascade, planned copies keep their data. */
export async function deleteMeal(id: number): Promise<void> {
	await db.delete(meals).where(eq(meals.id, id));
}
