import { eq } from 'drizzle-orm';
import { mealTypes, type MealTypeKey } from '$lib/config/meal-types';
import type { MealDetail, MealInput } from '$lib/schemas/meal';
import { db } from '$lib/server/db';
import { toNum } from '$lib/server/db/decimal';
import { mealIngredients, mealTypeLinks, meals } from '$lib/server/db/schema';
import { toIngredient } from './ingredients';

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

/** A meal with its types and ingredient rows (in form order); hidden ingredients included. */
export async function getMeal(id: number): Promise<MealDetail | null> {
	const row = await db.query.meals.findFirst({
		where: eq(meals.id, id),
		with: {
			types: true,
			ingredients: {
				orderBy: (t, { asc }) => [asc(t.position), asc(t.id)],
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
