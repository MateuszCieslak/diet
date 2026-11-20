import * as v from 'valibot';
import { categories, type CategoryKey } from '$lib/config/categories';
import { units, type Unit } from '$lib/config/units';
import { pl } from '$lib/i18n/pl';
import { decimalInput, nameInput } from './common';

export type Ingredient = {
	id: number;
	name: string;
	unit: Unit;
	category: CategoryKey;
	kcal: number;
	protein: number;
	fat: number;
	carbs: number;
	hidden: boolean;
};

/** The largest value a `decimal(7,2)` nutrition column holds. */
export const nutritionMax = 99999.99;

const nutritionInput = v.pipe(
	decimalInput({ allowZero: true }),
	v.maxValue(nutritionMax, pl.errors.max('99 999,99'))
);

const ingredientFields = {
	name: nameInput,
	category: v.picklist(categories, pl.errors.required),
	kcal: nutritionInput,
	protein: nutritionInput,
	fat: nutritionInput,
	carbs: nutritionInput
};

export const ingredientCreateSchema = v.object({
	...ingredientFields,
	unit: v.picklist(units, pl.errors.required)
});

/** The unit is immutable after creation, so the update schema drops it (`v.object` strips unknown keys). */
export const ingredientUpdateSchema = v.object(ingredientFields);

export type IngredientCreate = v.InferOutput<typeof ingredientCreateSchema>;
export type IngredientUpdate = v.InferOutput<typeof ingredientUpdateSchema>;

/** What the ingredient form posts and gets back after a failed submit: raw strings as typed. */
export type IngredientFormValues = {
	name: string;
	unit: string;
	category: string;
	kcal: string;
	protein: string;
	fat: string;
	carbs: string;
};

const formNumber = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2, useGrouping: false });

export function ingredientFormValues(ingredient: Ingredient): IngredientFormValues {
	return {
		name: ingredient.name,
		unit: ingredient.unit,
		category: ingredient.category,
		kcal: formNumber.format(ingredient.kcal),
		protein: formNumber.format(ingredient.protein),
		fat: formNumber.format(ingredient.fat),
		carbs: formNumber.format(ingredient.carbs)
	};
}

/** Reads the form fields as strings (missing fields become `''`). */
export function readIngredientForm(form: FormData): IngredientFormValues {
	const get = (key: string) => {
		const value = form.get(key);
		return typeof value === 'string' ? value : '';
	};
	return {
		name: get('name'),
		unit: get('unit'),
		category: get('category'),
		kcal: get('kcal'),
		protein: get('protein'),
		fat: get('fat'),
		carbs: get('carbs')
	};
}
