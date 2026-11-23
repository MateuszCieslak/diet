import { mealTypes, type MealTypeKey } from '$lib/config/meal-types';
import { searchTerm } from '$lib/search';
import { decodeCursor, type Cursor } from './pagination';

export type MealsQuery = { q: string; type?: MealTypeKey; cursor: Cursor | null };

/**
 * Reads `q`, `type` and `cursor` from the URL; a search under two characters, an unknown type or
 * a bad cursor is ignored.
 */
export function readMealsQuery(url: URL): MealsQuery {
	const q = searchTerm((url.searchParams.get('q') ?? '').slice(0, 120));
	const type = mealTypes.find((t) => t === url.searchParams.get('type'));
	return { q, type, cursor: decodeCursor(url.searchParams.get('cursor')) };
}
