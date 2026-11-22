import { error } from '@sveltejs/kit';
import { getPlanMeal, getSourceMealTypes } from '$lib/server/repositories/plan';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.planMealId);
	const meal = Number.isInteger(id) && id > 0 ? await getPlanMeal(id) : null;
	if (!meal) error(404);
	const types =
		meal.sourceMealId === null
			? []
			: ((await getSourceMealTypes([meal.sourceMealId]))[meal.sourceMealId] ?? []);
	return { meal, types };
};
