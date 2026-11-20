import * as v from 'valibot';
import { itemPatchSchema, manualItemSchema, quickAddSchema } from './shopping';

test('patch schema', () => {
	expect(v.safeParse(itemPatchSchema, {}).success).toBe(false);
	expect(v.parse(itemPatchSchema, { done: true })).toEqual({ done: true });
	expect(v.parse(itemPatchSchema, { amount: null })).toEqual({ amount: null });
	expect(v.parse(itemPatchSchema, { amount: '1,5', done: false })).toEqual({
		amount: 1.5,
		done: false
	});
	expect(v.safeParse(itemPatchSchema, { amount: '0' }).success).toBe(false);
	expect(v.safeParse(itemPatchSchema, { done: 'yes' }).success).toBe(false);
});

test('manual item schema', () => {
	expect(v.parse(manualItemSchema, { name: ' Zapałki ', amount: '', unit: '' })).toEqual({
		name: 'Zapałki'
	});
	expect(v.parse(manualItemSchema, { name: 'Mleko', amount: '2', unit: 'pcs' })).toEqual({
		name: 'Mleko',
		amount: 2,
		unit: 'pcs'
	});
	// The JSON body leaves out keys the parsed form dropped.
	expect(v.parse(manualItemSchema, { name: 'Zapałki' })).toEqual({ name: 'Zapałki' });
	expect(v.safeParse(manualItemSchema, { name: ' ' }).success).toBe(false);
	expect(v.safeParse(manualItemSchema, { name: 'Mleko', unit: 'kg' }).success).toBe(false);
});

test('quickAddSchema accepts both shapes', () => {
	expect(v.parse(quickAddSchema, { ingredientId: 3, amount: '1,5' })).toEqual({
		ingredientId: 3,
		amount: 1.5
	});
	expect(v.parse(quickAddSchema, { ingredientId: 3 })).toEqual({ ingredientId: 3 });
	expect(v.parse(quickAddSchema, { name: 'Zapałki' })).toMatchObject({ name: 'Zapałki' });
	expect(v.safeParse(quickAddSchema, { ingredientId: 0 }).success).toBe(false);
	expect(v.safeParse(quickAddSchema, {}).success).toBe(false);
});
