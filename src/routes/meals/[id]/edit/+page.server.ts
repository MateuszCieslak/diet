import { error, fail, redirect } from '@sveltejs/kit';
import { pl } from '$lib/i18n/pl';
import { isDuplicateKeyError } from '$lib/server/db/errors';
import { readMealSubmission } from '$lib/server/meal-form';
import { deleteMeal, getMeal, updateMeal } from '$lib/server/repositories/meals';
import type { Actions, PageServerLoad } from './$types';

async function loadMeal(param: string) {
	const id = Number(param);
	const meal = Number.isInteger(id) && id > 0 ? await getMeal(id) : null;
	if (!meal) error(404);
	return meal;
}

export const load: PageServerLoad = async ({ params }) => {
	return { meal: await loadMeal(params.id) };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const meal = await loadMeal(params.id);
		const submission = await readMealSubmission(await request.formData());
		if (!submission.ok) return fail(400, { errors: submission.errors });

		try {
			// Without a new upload the meal keeps its photo. The old file is not deleted here:
			// planned copies may share it, and the daily cleanup removes orphans.
			await updateMeal(meal.id, { ...submission.data, photo: submission.photo ?? meal.photo });
		} catch (e) {
			if (isDuplicateKeyError(e)) return fail(400, { errors: { name: pl.errors.nameTaken } });
			throw e;
		}
		redirect(303, `/meals/${meal.id}`);
	},
	delete: async ({ params }) => {
		const meal = await loadMeal(params.id);
		await deleteMeal(meal.id);
		redirect(303, '/meals');
	}
};
