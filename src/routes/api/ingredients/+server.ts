import { json } from '@sveltejs/kit';
import { readIngredientsQuery } from '$lib/server/ingredients-query';
import { listIngredients } from '$lib/server/repositories/ingredients';
import type { RequestHandler } from './$types';

/** Ingredients list pages and pickers: `{ items, nextCursor }`, 30 visible ingredients per page. */
export const GET: RequestHandler = async ({ url }) =>
	json(await listIngredients(readIngredientsQuery(url)));
