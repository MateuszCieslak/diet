import { error, fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { pl } from '$lib/i18n/pl';
import { formErrors } from '$lib/schemas/common';
import { ingredientUpdateSchema, readIngredientForm } from '$lib/schemas/ingredient';
import {
	getIngredient,
	hideIngredient,
	updateIngredient,
	visibleNameExists
} from '$lib/server/repositories/ingredients';
import type { Actions, PageServerLoad } from './$types';

/** The visible ingredient from the URL, or a 404 (hidden ingredients cannot be edited). */
async function loadIngredient(param: string) {
	const id = Number(param);
	const ingredient = Number.isInteger(id) && id > 0 ? await getIngredient(id) : null;
	if (!ingredient || ingredient.hidden) error(404);
	return ingredient;
}

export const load: PageServerLoad = async ({ params }) => {
	return { ingredient: await loadIngredient(params.id) };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const { id } = await loadIngredient(params.id);
		const values = readIngredientForm(await request.formData());
		const parsed = v.safeParse(ingredientUpdateSchema, values);
		if (!parsed.success) return fail(400, { values, errors: formErrors(parsed.issues) });

		if (await visibleNameExists(parsed.output.name, id)) {
			return fail(400, { values, errors: { name: pl.ingredients.nameTaken } });
		}

		await updateIngredient(id, parsed.output);
		redirect(303, '/ingredients');
	},
	hide: async ({ params }) => {
		const { id } = await loadIngredient(params.id);
		await hideIngredient(id);
		redirect(303, '/ingredients');
	}
};
