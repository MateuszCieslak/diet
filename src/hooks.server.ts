import { env } from '$env/dynamic/private';
import { json, redirect, type Handle, type ServerInit } from '@sveltejs/kit';
import { sessionCookie, verifySessionToken } from '$lib/server/auth';
import { startCleanupSchedule } from '$lib/server/cleanup';

export const init: ServerInit = async () => startCleanupSchedule();

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/login') return resolve(event);

	const secret = env.SESSION_SECRET;
	if (!secret) throw new Error('SESSION_SECRET is not set');

	if (!verifySessionToken(event.cookies.get(sessionCookie), secret, Date.now())) {
		if (event.url.pathname.startsWith('/api/')) {
			return json({ error: 'unauthorized' }, { status: 401 });
		}
		redirect(303, '/login');
	}

	return resolve(event);
};
