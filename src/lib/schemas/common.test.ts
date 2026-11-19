import * as v from 'valibot';
import { decimalInput, formErrors, nameInput, optionalDecimalInput } from './common';
import { pl } from '$lib/i18n/pl';

test('decimal input accepts Polish comma', () => {
	expect(v.parse(decimalInput(), '1,5')).toBe(1.5);
	expect(v.parse(decimalInput(), '2.25')).toBe(2.25);
	expect(v.safeParse(decimalInput(), '0').success).toBe(false);
	expect(v.parse(decimalInput({ allowZero: true }), '0')).toBe(0);
	expect(v.safeParse(decimalInput(), 'abc').success).toBe(false);
	expect(v.safeParse(decimalInput(), '1,234').success).toBe(false);
	expect(v.parse(optionalDecimalInput(), '')).toBeUndefined();
});

test('decimal input takes numbers, trims spaces and honors min', () => {
	expect(v.parse(decimalInput(), 3)).toBe(3);
	expect(v.parse(decimalInput(), ' 12,5 ')).toBe(12.5);
	expect(v.safeParse(decimalInput(), '-1').success).toBe(false);
	expect(v.safeParse(decimalInput(), '').success).toBe(false);
	expect(v.safeParse(decimalInput({ min: 5 }), '4,99').success).toBe(false);
	expect(v.parse(decimalInput({ min: 5 }), '5')).toBe(5);
	expect(v.parse(optionalDecimalInput(), '0,5')).toBe(0.5);
	expect(v.safeParse(optionalDecimalInput(), '0').success).toBe(false);
	expect(v.parse(optionalDecimalInput(), null)).toBeUndefined();
});

test('name input is trimmed and 1 to 120 characters long', () => {
	expect(v.parse(nameInput, '  Owsianka ')).toBe('Owsianka');
	expect(v.safeParse(nameInput, '   ').success).toBe(false);
	expect(v.safeParse(nameInput, 'a'.repeat(121)).success).toBe(false);
	expect(v.parse(nameInput, 'a'.repeat(120))).toHaveLength(120);
});

test('form errors are flattened per field with Polish messages', () => {
	const schema = v.object({ name: nameInput, amount: decimalInput() });
	const result = v.safeParse(schema, { name: ' ', amount: 'x' });
	expect(result.success).toBe(false);
	expect(formErrors(result.issues ?? [])).toEqual({
		name: pl.errors.required,
		amount: pl.errors.number
	});
});
