/** Every search in the app starts at this many characters (trimmed). */
export const searchMinLength = 2;

/** Every search waits this long after the last keystroke before it asks the server. */
export const searchDebounceMs = 300;

/** The query to search for: trimmed, or `''` (no search) while it is shorter than the minimum. */
export function searchTerm(raw: string): string {
	const q = raw.trim();
	return q.length >= searchMinLength ? q : '';
}
