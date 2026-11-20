/**
 * True for a mysql2 error raised by a UNIQUE or PRIMARY KEY violation. Drizzle wraps driver errors
 * in `DrizzleQueryError` with the original in `cause`, so the cause chain is searched too.
 */
export function isDuplicateKeyError(e: unknown): boolean {
	for (let err = e, depth = 0; typeof err === 'object' && err !== null && depth < 5; depth++) {
		if ('code' in err && err.code === 'ER_DUP_ENTRY') return true;
		err = 'cause' in err ? err.cause : undefined;
	}
	return false;
}
