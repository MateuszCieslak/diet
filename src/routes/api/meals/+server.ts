import { json } from '@sveltejs/kit';
import { readMealsQuery } from '$lib/server/meals-query';
import { listMeals } from '$lib/server/repositories/meals';
import type { RequestHandler } from './$types';

/** Meal picker and meals list pages: `{ items, nextCursor }`, 30 per page. */
export const GET: RequestHandler = async ({ url }) => json(await listMeals(readMealsQuery(url)));
