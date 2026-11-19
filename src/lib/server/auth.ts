import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const sessionCookie = 'diet_session';
export const sessionTtlMs = 180 * 24 * 60 * 60 * 1000;

function sign(secret: string, payload: string): string {
	return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Stateless session token: `${expiresAt}.${hmac(expiresAt)}`. */
export function createSessionToken(secret: string, now: number): string {
	const expiresAt = String(now + sessionTtlMs);
	return `${expiresAt}.${sign(secret, expiresAt)}`;
}

export function verifySessionToken(
	token: string | undefined,
	secret: string,
	now: number
): boolean {
	if (!token) return false;
	const match = /^(\d+)\.([A-Za-z0-9_-]+)$/.exec(token);
	if (!match) return false;
	const [, expiresAt, signature] = match;
	if (Number(expiresAt) < now) return false;
	const expected = Buffer.from(sign(secret, expiresAt));
	const actual = Buffer.from(signature);
	return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sha256(value: string): Buffer {
	return createHash('sha256').update(value).digest();
}

/** Compares SHA-256 digests so the comparison is constant-time regardless of input length. */
export function passwordMatches(input: string, expected: string): boolean {
	return timingSafeEqual(sha256(input), sha256(expected));
}

/** In-memory limit of failed login attempts per IP within a sliding window. */
export function createLoginThrottle(limit = 5, windowMs = 15 * 60_000) {
	const failures = new Map<string, number[]>();

	const recent = (ip: string, now: number) =>
		(failures.get(ip) ?? []).filter((at) => now - at < windowMs);

	return {
		isBlocked(ip: string, now: number): boolean {
			return recent(ip, now).length >= limit;
		},
		recordFailure(ip: string, now: number): void {
			failures.set(ip, [...recent(ip, now), now]);
		},
		reset(ip: string): void {
			failures.delete(ip);
		}
	};
}
