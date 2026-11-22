import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

export const maxPhotoBytes = 10 * 1024 * 1024;

const maxPhotoSide = 800;
const photoNamePattern = /^[0-9a-f-]{36}\.webp$/;

/** Auto-rotates from EXIF, fits inside 800×800 without enlarging and converts to WebP. */
export async function processPhoto(input: Buffer): Promise<Buffer> {
	// sharp drops all metadata (EXIF, ICC, XMP) unless `withMetadata` is called.
	return sharp(input)
		.rotate()
		.resize(maxPhotoSide, maxPhotoSide, { fit: 'inside', withoutEnlargement: true })
		.webp({ quality: 75 })
		.toBuffer();
}

/** The upload could not be decoded as an image (not an image, or a format sharp cannot read). */
export class InvalidPhotoError extends Error {
	constructor(cause: unknown) {
		super('Photo could not be processed', { cause });
		this.name = 'InvalidPhotoError';
	}
}

/**
 * Processes an uploaded photo, writes it to `dir` (created if missing) and returns the new file
 * name. Throws `InvalidPhotoError` for unreadable images; any other error (e.g. the directory is
 * not writable) is a server problem and is thrown as is.
 */
export async function savePhoto(file: File, dir: string): Promise<string> {
	if (file.size > maxPhotoBytes) throw new Error('Photo is too large');
	let output: Buffer;
	try {
		output = await processPhoto(Buffer.from(await file.arrayBuffer()));
	} catch (e) {
		throw new InvalidPhotoError(e);
	}
	const name = `${randomUUID()}.webp`;
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, name), output);
	return name;
}

export function isPhotoName(name: string): boolean {
	return photoNamePattern.test(name);
}
