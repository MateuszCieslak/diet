import { fail, redirect } from '@sveltejs/kit';
import { pl } from '$lib/i18n/pl';
import { isDuplicateKeyError } from '$lib/server/db/errors';
import { readMealSubmission } from '$lib/server/meal-form';
import { createMeal } from '$lib/server/repositories/meals';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const submission = await readMealSubmission(await request.formData());
		if (!submission.ok) return fail(400, { errors: submission.errors });

		let id: number;
		try {
			id = await createMeal({ ...submission.data, photo: submission.photo });
		} catch (e) {
			// The unique name index ignores case (collation), so `owsianka` clashes with `Owsianka`.
			if (isDuplicateKeyError(e)) return fail(400, { errors: { name: pl.errors.nameTaken } });
			throw e;
		}
		redirect(303, `/meals/${id}`);
	}
};
