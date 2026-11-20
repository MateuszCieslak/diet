import { mealTypes, type MealTypeKey } from '$lib/config/meal-types';
import { decodeCursor, type Cursor } from './pagination';

export type MealsQuery = { q: string; type?: MealTypeKey; cursor: Cursor | null };

/** Reads `q`, `type` and `cursor` from the URL; an unknown type or a bad cursor is ignored. */
export function readMealsQuery(url: URL): MealsQuery {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 120);
	const type = mealTypes.find((t) => t === url.searchParams.get('type'));
	return { q, type, cursor: decodeCursor(url.searchParams.get('cursor')) };
}
