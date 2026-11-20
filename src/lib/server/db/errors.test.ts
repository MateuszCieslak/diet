import { DrizzleQueryError } from 'drizzle-orm/errors';
import { isDuplicateKeyError } from './errors';

test('isDuplicateKeyError', () => {
	expect(isDuplicateKeyError({ code: 'ER_DUP_ENTRY' })).toBe(true);
	expect(isDuplicateKeyError(new Error('x'))).toBe(false);
	expect(isDuplicateKeyError(null)).toBe(false);
});

test('isDuplicateKeyError finds the driver error wrapped by Drizzle', () => {
	const driverError = Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY' });
	expect(isDuplicateKeyError(new DrizzleQueryError('insert ...', [], driverError))).toBe(true);
	expect(isDuplicateKeyError(new DrizzleQueryError('insert ...', [], new Error('x')))).toBe(false);
});

test('isDuplicateKeyError detects the unique meal name violation', () => {
	const driverError = Object.assign(new Error('Duplicate entry'), {
		code: 'ER_DUP_ENTRY',
		sqlMessage: "Duplicate entry 'owsianka' for key 'meals.meals_name_unique'"
	});
	expect(isDuplicateKeyError(driverError)).toBe(true);
	expect(isDuplicateKeyError(new DrizzleQueryError('insert ...', [], driverError))).toBe(true);
});
