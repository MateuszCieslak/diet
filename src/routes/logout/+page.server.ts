import { redirect } from '@sveltejs/kit';
import { sessionCookie } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		cookies.delete(sessionCookie, { path: '/' });
		redirect(303, '/login');
	}
};
