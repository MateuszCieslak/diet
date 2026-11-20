import * as v from 'valibot';
import { mealSchema } from './meal';

test('meal schema', () => {
	const ok = v.parse(mealSchema, {
		name: ' Owsianka ',
		types: ['breakfast'],
		items: '[{"ingredientId":1,"amount":"1,5"}]',
		preparation: ''
	});
	expect(ok.name).toBe('Owsianka');
	expect(ok.items).toEqual([{ ingredientId: 1, amount: 1.5 }]);
	expect(
		v.safeParse(mealSchema, { name: 'X', types: [], items: '[{"ingredientId":1,"amount":1}]' })
			.success
	).toBe(false);
	expect(v.safeParse(mealSchema, { name: 'X', types: ['lunch'], items: '[]' }).success).toBe(false);
});

test('meal schema rejects bad items JSON and unknown types', () => {
	expect(v.safeParse(mealSchema, { name: 'X', types: ['lunch'], items: 'nope' }).success).toBe(
		false
	);
	expect(
		v.safeParse(mealSchema, {
			name: 'X',
			types: ['brunch'],
			items: '[{"ingredientId":1,"amount":1}]'
		}).success
	).toBe(false);
	expect(
		v.safeParse(mealSchema, {
			name: 'X',
			types: ['lunch'],
			items: '[{"ingredientId":1,"amount":"0"}]'
		}).success
	).toBe(false);
});

test('empty preparation becomes undefined', () => {
	const out = v.parse(mealSchema, {
		name: 'X',
		types: ['lunch', 'dinner'],
		items: '[{"ingredientId":2,"amount":100}]',
		preparation: '   '
	});
	expect(out.preparation).toBeUndefined();
	expect(out.types).toEqual(['lunch', 'dinner']);
});
