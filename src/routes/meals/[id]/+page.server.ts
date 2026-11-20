import { error } from '@sveltejs/kit';
import { getMeal } from '$lib/server/repositories/meals';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	const meal = Number.isInteger(id) && id > 0 ? await getMeal(id) : null;
	if (!meal) error(404);
	return { meal };
};
