import * as v from 'valibot';
import { env } from '$env/dynamic/private';
import { pl } from '$lib/i18n/pl';
import { formErrors } from '$lib/schemas/common';
import { mealSchema, readMealForm, type MealInput } from '$lib/schemas/meal';
import { InvalidPhotoError, maxPhotoBytes, savePhoto } from '$lib/server/photos';
import { existingIngredientIds } from '$lib/server/repositories/ingredients';

type MealSubmission =
	| { ok: true; data: MealInput; photo: string | null }
	| { ok: false; errors: Record<string, string> };

/**
 * Validates a posted meal form. Only when every field is valid is the uploaded photo (if any)
 * processed and saved; `photo` is then its new file name, or `null` when nothing was uploaded.
 */
export async function readMealSubmission(form: FormData): Promise<MealSubmission> {
	const parsed = v.safeParse(mealSchema, readMealForm(form));
	if (!parsed.success) return { ok: false, errors: formErrors(parsed.issues) };

	const ids = parsed.output.items.map((i) => i.ingredientId);
	const existing = await existingIngredientIds(ids);
	if (ids.some((id) => !existing.has(id))) {
		return { ok: false, errors: { items: pl.meals.itemsMissing } };
	}

	const file = form.get('photo');
	if (!(file instanceof File) || file.size === 0) {
		return { ok: true, data: parsed.output, photo: null };
	}
	if (file.size > maxPhotoBytes) return { ok: false, errors: { photo: pl.meals.photoTooLarge } };
	if (!env.PHOTOS_DIR) throw new Error('PHOTOS_DIR is not set');
	try {
		return { ok: true, data: parsed.output, photo: await savePhoto(file, env.PHOTOS_DIR) };
	} catch (e) {
		// Only an unreadable image is the user's problem; anything else (e.g. PHOTOS_DIR not
		// writable) is rethrown, logged by SvelteKit and shown as a server error.
		if (!(e instanceof InvalidPhotoError)) throw e;
		console.error(`Rejected photo "${file.name}" (${file.type || 'no type'}):`, e.cause);
		return { ok: false, errors: { photo: pl.meals.photoInvalid } };
	}
}
