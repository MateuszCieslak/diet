import { error, json } from '@sveltejs/kit';
import * as v from 'valibot';
import { itemPatchSchema } from '$lib/schemas/shopping';
import { patchItem } from '$lib/server/repositories/shopping';
import { readJson } from '$lib/server/read-json';
import type { RequestHandler } from './$types';

/**
 * Ticks, unticks or changes the amount of one item. Responds with the updated `ShoppingItemView`,
 * 404, or 400 with valibot issues. There is deliberately no DELETE: items are never removed one by one.
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isSafeInteger(id) || id < 1) error(404);

	const parsed = v.safeParse(itemPatchSchema, await readJson(request));
	if (!parsed.success) return json({ issues: parsed.issues }, { status: 400 });

	const item = await patchItem(id, parsed.output);
	if (!item) error(404);
	return json(item);
};
