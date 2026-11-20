import { readMealsQuery } from '$lib/server/meals-query';
import { listMeals } from '$lib/server/repositories/meals';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q, type } = readMealsQuery(url);
	return { q, type, page: await listMeals({ q, type }) };
};
