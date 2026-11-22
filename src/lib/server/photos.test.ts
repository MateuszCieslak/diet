import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { InvalidPhotoError, isPhotoName, maxPhotoBytes, processPhoto, savePhoto } from './photos';

test('resizes to max 800 and outputs webp', async () => {
	const src = await sharp({
		create: { width: 2000, height: 1000, channels: 3, background: '#f00' }
	})
		.jpeg()
		.toBuffer();
	const meta = await sharp(await processPhoto(src)).metadata();
	expect(meta.format).toBe('webp');
	expect(meta.width).toBe(800);
	expect(meta.height).toBe(400);
});

test('does not enlarge small images', async () => {
	const src = await sharp({ create: { width: 300, height: 200, channels: 3, background: '#0f0' } })
		.png()
		.toBuffer();
	expect((await sharp(await processPhoto(src)).metadata()).width).toBe(300);
});

test('rejects non-images', async () => {
	await expect(processPhoto(Buffer.from('hello'))).rejects.toThrow(/unsupported image format/);
});

test('isPhotoName', () => {
	expect(isPhotoName('0f8fad5b-d9cb-469f-a165-70867728950e.webp')).toBe(true);
	expect(isPhotoName('../etc/passwd')).toBe(false);
});

describe('savePhoto', () => {
	let dir: string;
	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'photos-'));
	});
	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	test('writes a processed webp and returns its name', async () => {
		const src = await sharp({
			create: { width: 1200, height: 900, channels: 3, background: '#00f' }
		})
			.jpeg()
			.toBuffer();
		const name = await savePhoto(new File([new Uint8Array(src)], 'a.jpg'), dir);
		expect(isPhotoName(name)).toBe(true);
		const meta = await sharp(await readFile(join(dir, name))).metadata();
		expect(meta.format).toBe('webp');
		expect(meta.width).toBe(800);
	});

	test('creates the directory when it does not exist', async () => {
		const src = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } })
			.jpeg()
			.toBuffer();
		const nested = join(dir, 'missing', 'photos');
		const name = await savePhoto(new File([new Uint8Array(src)], 'a.jpg'), nested);
		expect((await sharp(await readFile(join(nested, name))).metadata()).format).toBe('webp');
	});

	test('a file that is not an image throws InvalidPhotoError', async () => {
		const file = new File([new TextEncoder().encode('hello')], 'a.jpg');
		await expect(savePhoto(file, dir)).rejects.toBeInstanceOf(InvalidPhotoError);
	});

	test('a write failure is not reported as an invalid photo', async () => {
		const src = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } })
			.jpeg()
			.toBuffer();
		// A regular file where the directory should be: mkdir and the write both fail.
		const blocked = join(dir, 'blocked');
		await writeFile(blocked, 'x');
		const error = await savePhoto(new File([new Uint8Array(src)], 'a.jpg'), blocked).catch(
			(e: unknown) => e
		);
		expect(error).toBeInstanceOf(Error);
		expect(error).not.toBeInstanceOf(InvalidPhotoError);
	});

	test('rejects files over the size limit', async () => {
		const file = new File([new Uint8Array(maxPhotoBytes + 1)], 'big.jpg');
		await expect(savePhoto(file, dir)).rejects.toThrow('Photo is too large');
	});
});
