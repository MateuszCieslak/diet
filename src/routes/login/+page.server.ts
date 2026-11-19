import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import {
	createLoginThrottle,
	createSessionToken,
	passwordMatches,
	sessionCookie,
	sessionTtlMs
} from '$lib/server/auth';
import type { Actions } from './$types';

const throttle = createLoginThrottle();

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const appPassword = env.APP_PASSWORD;
		const secret = env.SESSION_SECRET;
		if (!appPassword || !secret) throw new Error('APP_PASSWORD and SESSION_SECRET must be set');

		const ip = getClientAddress();
		const now = Date.now();
		if (throttle.isBlocked(ip, now)) return fail(429, { error: 'tooManyAttempts' as const });

		const password = (await request.formData()).get('password');
		if (typeof password !== 'string' || !passwordMatches(password, appPassword)) {
			throttle.recordFailure(ip, now);
			return fail(400, { error: 'wrongPassword' as const });
		}

		throttle.reset(ip);
		cookies.set(sessionCookie, createSessionToken(secret, now), {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: sessionTtlMs / 1000
		});
		redirect(303, '/plan');
	}
};
