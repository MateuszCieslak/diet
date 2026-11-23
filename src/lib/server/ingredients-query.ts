import { searchTerm } from '$lib/search';
import { decodeCursor, type Cursor } from './pagination';

export type IngredientsQuery = { q: string; cursor: Cursor | null };

/** Reads `q` and `cursor` from the URL; a search under two characters or a bad cursor is ignored. */
export function readIngredientsQuery(url: URL): IngredientsQuery {
	const q = searchTerm((url.searchParams.get('q') ?? '').slice(0, 120));
	return { q, cursor: decodeCursor(url.searchParams.get('cursor')) };
}
