import { readIngredientsQuery } from '$lib/server/ingredients-query';
import { listIngredients } from '$lib/server/repositories/ingredients';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q } = readIngredientsQuery(url);
	return { q, page: await listIngredients({ q }) };
};
