import { json } from '@sveltejs/kit';
import * as v from 'valibot';
import { pl } from '$lib/i18n/pl';
import { quickAddSchema } from '$lib/schemas/shopping';
import { getIngredient } from '$lib/server/repositories/ingredients';
import { addIngredientItem, addManualItem } from '$lib/server/repositories/shopping';
import { readJson } from '$lib/server/read-json';
import type { RequestHandler } from './$types';

/**
 * Adds a manual item or a picked ingredient (which may increase an open item of that ingredient).
 * Responds 201 with the new or updated `ShoppingItemView`, or 400 with valibot issues.
 */
export const POST: RequestHandler = async ({ request }) => {
	const parsed = v.safeParse(quickAddSchema, await readJson(request));
	if (!parsed.success) return json({ issues: parsed.issues }, { status: 400 });

	const input = parsed.output;
	if (!('ingredientId' in input)) return json(await addManualItem(input), { status: 201 });

	const ingredient = await getIngredient(input.ingredientId);
	if (!ingredient || ingredient.hidden) {
		return json(
			{ issues: [{ path: [{ key: 'ingredientId' }], message: pl.errors.invalid }] },
			{ status: 400 }
		);
	}
	return json(await addIngredientItem(ingredient.id, input.amount ?? null), { status: 201 });
};
