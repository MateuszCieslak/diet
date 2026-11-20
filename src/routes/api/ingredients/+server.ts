import { json } from '@sveltejs/kit';
import { searchIngredients } from '$lib/server/repositories/ingredients';
import type { RequestHandler } from './$types';

/** Ingredient picker search: up to 20 visible ingredients whose name contains `q`. */
export const GET: RequestHandler = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').slice(0, 120);
	return json(await searchIngredients(q));
};
