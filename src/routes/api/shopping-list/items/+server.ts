import { json } from '@sveltejs/kit';
import * as v from 'valibot';
import { manualItemSchema } from '$lib/schemas/shopping';
import { addManualItem } from '$lib/server/repositories/shopping';
import { readJson } from '$lib/server/read-json';
import type { RequestHandler } from './$types';

/** Adds a manual item; responds 201 with the new `ShoppingItemView`, or 400 with valibot issues. */
export const POST: RequestHandler = async ({ request }) => {
	const parsed = v.safeParse(manualItemSchema, await readJson(request));
	if (!parsed.success) return json({ issues: parsed.issues }, { status: 400 });
	return json(await addManualItem(parsed.output), { status: 201 });
};
