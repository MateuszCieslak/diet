import { listIngredients } from '$lib/server/repositories/ingredients';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 120);
	return { q, ingredients: await listIngredients(q) };
};
