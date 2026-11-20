import { listShoppingItems } from '$lib/server/repositories/shopping';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ items: await listShoppingItems() });
