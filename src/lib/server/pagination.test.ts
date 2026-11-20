import { decodeCursor, encodeCursor } from './pagination';

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

test('cursor round-trip and garbage', () => {
	const c = { name: 'Żurek', id: 7 };
	expect(decodeCursor(encodeCursor(c))).toEqual(c);
	expect(decodeCursor('%%%')).toBeNull();
	expect(decodeCursor(null)).toBeNull();
});

test('decodeCursor rejects valid base64url with the wrong shape', () => {
	expect(decodeCursor(encode({ name: 'A' }))).toBeNull();
	expect(decodeCursor(encode({ name: 'A', id: 1.5 }))).toBeNull();
	expect(decodeCursor(encode({ name: 1, id: 1 }))).toBeNull();
	expect(decodeCursor(encode([1, 2]))).toBeNull();
});
