import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isPhotoName } from '$lib/server/photos';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	if (!env.PHOTOS_DIR) throw new Error('PHOTOS_DIR is not set');
	if (!isPhotoName(params.file)) error(404);

	let body: Buffer;
	try {
		body = await readFile(join(env.PHOTOS_DIR, params.file));
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') error(404);
		throw e;
	}

	return new Response(new Uint8Array(body), {
		headers: {
			'Content-Type': 'image/webp',
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};
