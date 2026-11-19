import {
	createLoginThrottle,
	createSessionToken,
	passwordMatches,
	sessionTtlMs,
	verifySessionToken
} from './auth';

test('token round-trip, expiry and tampering', () => {
	const t = createSessionToken('s', 1000);
	expect(verifySessionToken(t, 's', 2000)).toBe(true);
	expect(verifySessionToken(t, 's', 1000 + sessionTtlMs + 1)).toBe(false);
	expect(verifySessionToken(t, 'other', 2000)).toBe(false);
	expect(verifySessionToken(t.replace(/^\d+/, '9999999999999'), 's', 2000)).toBe(false);
	expect(verifySessionToken(undefined, 's', 2000)).toBe(false);
	expect(verifySessionToken('garbage', 's', 2000)).toBe(false);
});

test('password compare', () => {
	expect(passwordMatches('abc', 'abc')).toBe(true);
	expect(passwordMatches('abcd', 'abc')).toBe(false);
});

test('throttle blocks after 5 failures within window', () => {
	const t = createLoginThrottle();
	for (let i = 0; i < 5; i++) t.recordFailure('1.1.1.1', 0);
	expect(t.isBlocked('1.1.1.1', 1000)).toBe(true);
	expect(t.isBlocked('2.2.2.2', 1000)).toBe(false);
	expect(t.isBlocked('1.1.1.1', 15 * 60_000 + 1)).toBe(false);
});
