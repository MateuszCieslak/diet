import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { pl } from '$lib/i18n/pl';
import { formErrors } from '$lib/schemas/common';
import { ingredientCreateSchema, readIngredientForm } from '$lib/schemas/ingredient';
import { createIngredient, visibleNameExists } from '$lib/server/repositories/ingredients';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const values = readIngredientForm(await request.formData());
		const parsed = v.safeParse(ingredientCreateSchema, values);
		if (!parsed.success) return fail(400, { values, errors: formErrors(parsed.issues) });

		if (await visibleNameExists(parsed.output.name)) {
			return fail(400, { values, errors: { name: pl.ingredients.nameTaken } });
		}

		await createIngredient(parsed.output);
		redirect(303, '/ingredients');
	}
};
