import { findOrphanPhotos, planCutoffDate } from './cleanup';

// The real module needs DATABASE_URL; these tests cover only the pure parts.
vi.mock('$lib/server/db', () => ({ db: {} }));

test('planCutoffDate', () => {
	expect(planCutoffDate('2026-11-18')).toBe('2026-10-21');
});

test('findOrphanPhotos', () => {
	const a = '0f8fad5b-d9cb-469f-a165-70867728950e.webp';
	const b = '1f8fad5b-d9cb-469f-a165-70867728950e.webp';
	const c = '2f8fad5b-d9cb-469f-a165-70867728950e.webp';
	const now = 10 * 3_600_000;
	const files = [
		{ name: a, mtimeMs: 0 },
		{ name: b, mtimeMs: 0 },
		{ name: c, mtimeMs: now - 60_000 },
		{ name: '.gitkeep', mtimeMs: 0 }
	];
	expect(findOrphanPhotos(files, new Set([a]), now)).toEqual([b]);
});
