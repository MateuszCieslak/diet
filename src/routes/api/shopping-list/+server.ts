import { json } from '@sveltejs/kit';
import { listShoppingItems } from '$lib/server/repositories/shopping';
import type { RequestHandler } from './$types';

/** The whole shopping list as `ShoppingItemView[]`; the page polls this to refresh. */
export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'no-store' });
	return json(await listShoppingItems());
};
