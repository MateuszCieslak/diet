import * as v from 'valibot';

/** A keyset position: the last row of the previous page, ordered by `(name, id)`. */
export type Cursor = { name: string; id: number };

const cursorSchema = v.object({
	name: v.string(),
	id: v.pipe(v.number(), v.integer(), v.minValue(1))
});

export function encodeCursor(c: Cursor): string {
	return Buffer.from(JSON.stringify({ name: c.name, id: c.id })).toString('base64url');
}

/** `null` for a missing cursor and for anything that is not one we encoded. */
export function decodeCursor(s: string | null): Cursor | null {
	if (!s) return null;
	try {
		const result = v.safeParse(cursorSchema, JSON.parse(Buffer.from(s, 'base64url').toString()));
		return result.success ? result.output : null;
	} catch {
		return null;
	}
}
