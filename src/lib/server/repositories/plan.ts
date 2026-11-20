import { and, asc, eq, inArray, max, type SQL } from 'drizzle-orm';
import { mealTypes, type MealTypeKey } from '$lib/config/meal-types';
import { users } from '$lib/config/users';
import { isValidReorder, type PlanMeal } from '$lib/plan';
import type { MealInput } from '$lib/schemas/meal';
import { db } from '$lib/server/db';
import { toNum } from '$lib/server/db/decimal';
import {
	mealIngredients,
	mealTypeLinks,
	meals,
	planMealExclusions,
	planMealIngredients,
	planMeals
} from '$lib/server/db/schema';
import { toIngredient } from './ingredients';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type ItemWrite = { ingredientId: number; amount: number };

/** The meal or planned meal an operation refers to does not exist (any more). */
export class PlanNotFoundError extends Error {}

/** Planned meals with ingredients (in form order) and exclusions, by date and position. */
function queryPlanMeals(where: SQL) {
	return db.query.planMeals.findMany({
		where,
		orderBy: [asc(planMeals.date), asc(planMeals.position), asc(planMeals.id)],
		with: {
			ingredients: {
				orderBy: [asc(planMealIngredients.position), asc(planMealIngredients.id)],
				with: { ingredient: true }
			},
			exclusions: true
		}
	});
}

type PlanMealRow = Awaited<ReturnType<typeof queryPlanMeals>>[number];

function toPlanMeal(row: PlanMealRow): PlanMeal {
	return {
		id: row.id,
		date: row.date,
		position: row.position,
		sourceMealId: row.sourceMealId,
		name: row.name,
		photo: row.photoPath,
		preparation: row.preparation,
		items: row.ingredients.map((i) => ({
			ingredient: toIngredient(i.ingredient),
			amount: toNum(i.amount)
		})),
		excludedUserKeys: row.exclusions.map((e) => e.userKey)
	};
}

async function insertItems(tx: Tx, planMealId: number, items: ItemWrite[]): Promise<void> {
	if (items.length === 0) return;
	await tx.insert(planMealIngredients).values(
		items.map((item, position) => ({
			planMealId,
			ingredientId: item.ingredientId,
			amount: String(item.amount),
			position
		}))
	);
}

/** The meal's copyable fields and ingredient rows; throws `PlanNotFoundError` if it is gone. */
async function readSourceMeal(tx: Tx, mealId: number) {
	const meal = await tx.query.meals.findFirst({
		where: eq(meals.id, mealId),
		with: { ingredients: { orderBy: [asc(mealIngredients.position), asc(mealIngredients.id)] } }
	});
	if (!meal) throw new PlanNotFoundError(`Meal ${mealId} not found`);
	return {
		fields: {
			sourceMealId: meal.id,
			name: meal.name,
			photoPath: meal.photoPath,
			preparation: meal.preparation
		},
		items: meal.ingredients.map((i) => ({ ingredientId: i.ingredientId, amount: toNum(i.amount) }))
	};
}

async function lockPlanMeal(tx: Tx, id: number): Promise<void> {
	const [row] = await tx
		.select({ id: planMeals.id })
		.from(planMeals)
		.where(eq(planMeals.id, id))
		.for('update');
	if (!row) throw new PlanNotFoundError(`Plan meal ${id} not found`);
}

/** Planned meals on the given dates with ingredients and exclusions, by date and position. */
export async function getPlanForDates(dates: string[]): Promise<PlanMeal[]> {
	if (dates.length === 0) return [];
	const rows = await queryPlanMeals(inArray(planMeals.date, dates));
	return rows.map(toPlanMeal);
}

export async function getPlanMeal(id: number): Promise<PlanMeal | null> {
	const [row] = await queryPlanMeals(eq(planMeals.id, id));
	return row ? toPlanMeal(row) : null;
}

/** Types of the source meals, by meal id. Copies whose source was deleted have none. */
export async function getSourceMealTypes(
	mealIds: number[]
): Promise<Record<number, MealTypeKey[]>> {
	if (mealIds.length === 0) return {};
	const rows = await db
		.select()
		.from(mealTypeLinks)
		.where(inArray(mealTypeLinks.mealId, [...new Set(mealIds)]));
	const result: Record<number, MealTypeKey[]> = {};
	for (const id of mealIds) {
		const types = rows.filter((r) => r.mealId === id).map((r) => r.type);
		result[id] = mealTypes.filter((t) => types.includes(t));
	}
	return result;
}

/** Copies the meal to the end of the day. Throws `PlanNotFoundError` if the meal is gone. */
export async function addMealToDay(date: string, mealId: number): Promise<void> {
	await db.transaction(async (tx) => {
		const source = await readSourceMeal(tx, mealId);
		// Locks the day's rows (and the gap after them), so two adds cannot take the same position.
		const [last] = await tx
			.select({ position: max(planMeals.position) })
			.from(planMeals)
			.where(eq(planMeals.date, date))
			.for('update');
		const [result] = await tx
			.insert(planMeals)
			.values({ ...source.fields, date, position: (last?.position ?? -1) + 1 })
			.$returningId();
		await insertItems(tx, result.id, source.items);
	});
}

/** Overwrites the copy with the meal's data; position and exclusions stay. */
export async function replacePlanMeal(planMealId: number, mealId: number): Promise<void> {
	await db.transaction(async (tx) => {
		await lockPlanMeal(tx, planMealId);
		const source = await readSourceMeal(tx, mealId);
		await tx.update(planMeals).set(source.fields).where(eq(planMeals.id, planMealId));
		await tx.delete(planMealIngredients).where(eq(planMealIngredients.planMealId, planMealId));
		await insertItems(tx, planMealId, source.items);
	});
}

/** Ingredients and exclusions cascade. Removing a missing row is a no-op. */
export async function removePlanMeal(id: number): Promise<void> {
	await db.transaction(async (tx) => {
		await tx.delete(planMeals).where(eq(planMeals.id, id));
	});
}

/** Excludes the user from the planned meal, or includes them again. */
export async function toggleExclusion(planMealId: number, userKey: string): Promise<void> {
	if (!users.some((u) => u.key === userKey)) throw new Error(`Unknown user key: ${userKey}`);
	await db.transaction(async (tx) => {
		await lockPlanMeal(tx, planMealId);
		const match = and(
			eq(planMealExclusions.planMealId, planMealId),
			eq(planMealExclusions.userKey, userKey)
		);
		const [existing] = await tx.select().from(planMealExclusions).where(match);
		if (existing) await tx.delete(planMealExclusions).where(match);
		else await tx.insert(planMealExclusions).values({ planMealId, userKey });
	});
}

/** Sets positions to the given order. `false` if the ids are not exactly the day's meals. */
export async function reorderDay(date: string, orderedIds: number[]): Promise<boolean> {
	return db.transaction(async (tx) => {
		const rows = await tx
			.select({ id: planMeals.id })
			.from(planMeals)
			.where(eq(planMeals.date, date))
			.for('update');
		if (
			!isValidReorder(
				rows.map((r) => r.id),
				orderedIds
			)
		) {
			return false;
		}
		for (const [position, id] of orderedIds.entries()) {
			await tx.update(planMeals).set({ position }).where(eq(planMeals.id, id));
		}
		return true;
	});
}

/** Rewrites this day's copy only; the source meal is never changed. */
export async function updatePlanMeal(
	id: number,
	data: Pick<MealInput, 'name' | 'items' | 'preparation'>
): Promise<void> {
	await db.transaction(async (tx) => {
		await lockPlanMeal(tx, id);
		await tx
			.update(planMeals)
			.set({ name: data.name, preparation: data.preparation ?? null })
			.where(eq(planMeals.id, id));
		await tx.delete(planMealIngredients).where(eq(planMealIngredients.planMealId, id));
		await insertItems(tx, id, data.items);
	});
}
