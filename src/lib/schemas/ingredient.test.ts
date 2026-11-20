import * as v from 'valibot';
import {
	ingredientCreateSchema,
	ingredientFormValues,
	ingredientUpdateSchema,
	readIngredientForm
} from './ingredient';

test('update schema ignores unit', () => {
	const out = v.parse(ingredientUpdateSchema, {
		name: 'Jajko',
		unit: 'g',
		category: 'dairy',
		kcal: '70',
		protein: '6',
		fat: '5',
		carbs: '0,5'
	});
	expect(out).not.toHaveProperty('unit');
	expect(out.carbs).toBe(0.5);
});

test('create schema rejects unknown unit and category', () => {
	const base = { name: 'X', kcal: 1, protein: 0, fat: 0, carbs: 0 };
	expect(
		v.safeParse(ingredientCreateSchema, { ...base, unit: 'kg', category: 'dairy' }).success
	).toBe(false);
	expect(
		v.safeParse(ingredientCreateSchema, { ...base, unit: 'g', category: 'nope' }).success
	).toBe(false);
});

test('create schema accepts zero nutrition and rejects values that do not fit the column', () => {
	const base = { name: 'Woda', unit: 'ml', category: 'drinks', protein: '0', fat: '0', carbs: '0' };
	expect(v.parse(ingredientCreateSchema, { ...base, kcal: '0' }).kcal).toBe(0);
	expect(v.safeParse(ingredientCreateSchema, { ...base, kcal: '100000' }).success).toBe(false);
});

test('form values use a Polish comma so they parse back unchanged', () => {
	const values = ingredientFormValues({
		id: 1,
		name: 'Jajko',
		unit: 'pcs',
		category: 'dairy',
		kcal: 70,
		protein: 6.25,
		fat: 5,
		carbs: 0.5,
		hidden: false
	});
	expect(values.carbs).toBe('0,5');
	expect(values.protein).toBe('6,25');
	expect(v.parse(ingredientCreateSchema, values).carbs).toBe(0.5);
});

test('readIngredientForm returns empty strings for missing fields', () => {
	const form = new FormData();
	form.set('name', 'Jajko');
	expect(readIngredientForm(form)).toEqual({
		name: 'Jajko',
		unit: '',
		category: '',
		kcal: '',
		protein: '',
		fat: '',
		carbs: ''
	});
});
