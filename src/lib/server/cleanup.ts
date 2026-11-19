import { readdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { isNotNull, lt } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { addDays, todayIn } from '$lib/dates';
import { db } from '$lib/server/db';
import { meals, planMeals } from '$lib/server/db/schema';
import { isPhotoName } from '$lib/server/photos';

export const planRetentionDays = 28;

const cleanupIntervalMs = 24 * 60 * 60 * 1000;

/** Plan meals dated before the returned date are deleted. */
export function planCutoffDate(today: string): string {
	return addDays(today, -planRetentionDays);
}

/**
 * Photo files that no row references. Files younger than `minAgeMs` are kept, so a photo whose
 * upload is still being saved is not removed before its row exists.
 */
export function findOrphanPhotos(
	files: { name: string; mtimeMs: number }[],
	referenced: Set<string>,
	now: number,
	minAgeMs = 3_600_000
): string[] {
	return files
		.filter((f) => isPhotoName(f.name) && !referenced.has(f.name) && now - f.mtimeMs >= minAgeMs)
		.map((f) => f.name);
}

async function referencedPhotos(): Promise<Set<string>> {
	const [mealRows, planRows] = await Promise.all([
		db.select({ photoPath: meals.photoPath }).from(meals).where(isNotNull(meals.photoPath)),
		db
			.select({ photoPath: planMeals.photoPath })
			.from(planMeals)
			.where(isNotNull(planMeals.photoPath))
	]);
	return new Set([...mealRows, ...planRows].flatMap((r) => (r.photoPath ? [r.photoPath] : [])));
}

/** Deletes old plan meals (children cascade), then photo files nothing references. */
export async function runCleanup(): Promise<void> {
	const cutoff = planCutoffDate(todayIn(env.TZ ?? 'Europe/Warsaw'));
	const [result] = await db.delete(planMeals).where(lt(planMeals.date, cutoff));

	const dir = env.PHOTOS_DIR;
	if (!dir) throw new Error('PHOTOS_DIR is not set');
	// Read references after deleting plan meals, so photos only they used are removed now.
	const referenced = await referencedPhotos();
	const names = (await readdir(dir)).filter(isPhotoName);
	const files = await Promise.all(
		names.map(async (name) => ({ name, mtimeMs: (await stat(join(dir, name))).mtimeMs }))
	);
	const orphans = findOrphanPhotos(files, referenced, Date.now());
	await Promise.all(orphans.map((name) => unlink(join(dir, name))));

	console.log(
		`cleanup: deleted ${result.affectedRows} plan meals before ${cutoff} and ${orphans.length} orphan photos`
	);
}

function runLogged(): Promise<void> {
	return runCleanup().catch((error: unknown) => {
		console.error('cleanup failed', error);
	});
}

/** Runs the cleanup now and then every 24 h; failures are logged. Requires a single app process. */
export function startCleanupSchedule(): void {
	void runLogged();
	setInterval(runLogged, cleanupIntervalMs);
}
