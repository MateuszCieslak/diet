import { error, fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { pl } from '$lib/i18n/pl';
import { formErrors } from '$lib/schemas/common';
import { mealSchema, readMealForm } from '$lib/schemas/meal';
import { isDuplicateKeyError } from '$lib/server/db/errors';
import { existingIngredientIds } from '$lib/server/repositories/ingredients';
import { createMeal } from '$lib/server/repositories/meals';
import { PlanNotFoundError, getPlanMeal, updatePlanMeal } from '$lib/server/repositories/plan';
import type { Actions, PageServerLoad } from './$types';

/** A planned copy has no types; `saveAsRecipe` validates them with the full `mealSchema`. */
const planMealSchema = v.omit(mealSchema, ['types']);

async function loadPlanMeal(param: string) {
	const id = Number(param);
	const planMeal = Number.isInteger(id) && id > 0 ? await getPlanMeal(id) : null;
	if (!planMeal) error(404);
	return planMeal;
}

type Submission<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };

/** Validates the posted form with `schema` and checks that every ingredient still exists. */
async function readSubmission<S extends typeof planMealSchema | typeof mealSchema>(
	form: FormData,
	schema: S
): Promise<Submission<v.InferOutput<S>>> {
	const parsed = v.safeParse(schema, readMealForm(form));
	if (!parsed.success) return { ok: false, errors: formErrors(parsed.issues) };

	const ids = parsed.output.items.map((i) => i.ingredientId);
	const existing = await existingIngredientIds(ids);
	if (ids.some((id) => !existing.has(id))) {
		return { ok: false, errors: { items: pl.meals.itemsMissing } };
	}
	return { ok: true, data: parsed.output };
}

export const load: PageServerLoad = async ({ params }) => {
	return { planMeal: await loadPlanMeal(params.planMealId) };
};

export const actions: Actions = {
	save: async ({ params, request }) => {
		const planMeal = await loadPlanMeal(params.planMealId);
		const submission = await readSubmission(await request.formData(), planMealSchema);
		if (!submission.ok) return fail(400, { errors: submission.errors });

		try {
			await updatePlanMeal(planMeal.id, submission.data);
		} catch (e) {
			if (e instanceof PlanNotFoundError) error(404);
			throw e;
		}
		redirect(303, `/plan?date=${planMeal.date}`);
	},
	saveAsRecipe: async ({ params, request }) => {
		const planMeal = await loadPlanMeal(params.planMealId);
		const submission = await readSubmission(await request.formData(), mealSchema);
		// `recipe` tells the page to point at the errors from the "save as recipe" button.
		if (!submission.ok) return fail(400, { errors: submission.errors, recipe: true });

		try {
			// The new meal shares the copy's photo file; the daily cleanup keeps files still in use.
			const id = await createMeal({ ...submission.data, photo: planMeal.photo });
			return { saved: { id, name: submission.data.name } };
		} catch (e) {
			if (isDuplicateKeyError(e)) {
				const errors: Record<string, string> = { name: pl.errors.nameTaken };
				return fail(400, { errors, recipe: true });
			}
			throw e;
		}
	}
};
