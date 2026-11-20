import * as v from 'valibot';
import { mealTypes, type MealTypeKey } from '$lib/config/meal-types';
import { pl } from '$lib/i18n/pl';
import type { Nutrition } from '$lib/nutrition';
import { decimalInput, nameInput } from './common';
import type { Ingredient } from './ingredient';

/** The largest value a `decimal(8,2)` amount column holds. */
export const amountMax = 999999.99;

export const preparationMaxLength = 10000;

const mealItemSchema = v.object({
	ingredientId: v.pipe(v.number(pl.errors.invalid), v.integer(pl.errors.invalid), v.minValue(1)),
	amount: v.pipe(decimalInput(), v.maxValue(amountMax, pl.errors.max('999 999,99')))
});

/** The ingredient rows, posted as one JSON field (`items`) by `MealForm`. */
export const mealItemsSchema = v.pipe(
	v.string(pl.errors.invalid),
	v.rawTransform(({ dataset, addIssue, NEVER }) => {
		try {
			return JSON.parse(dataset.value) as unknown;
		} catch {
			addIssue({ message: pl.errors.invalid });
			return NEVER;
		}
	}),
	v.array(mealItemSchema, pl.errors.invalid),
	v.minLength(1, pl.meals.itemsRequired)
);

export const mealSchema = v.object({
	name: nameInput,
	types: v.pipe(
		v.array(v.picklist(mealTypes, pl.errors.invalid), pl.errors.invalid),
		v.minLength(1, pl.meals.typesRequired),
		v.transform((types) => [...new Set(types)])
	),
	items: mealItemsSchema,
	preparation: v.pipe(
		v.optional(v.string(), ''),
		v.trim(),
		v.maxLength(preparationMaxLength, pl.errors.maxLength(preparationMaxLength)),
		v.transform((text) => (text === '' ? undefined : text))
	)
});

export type MealInput = v.InferOutput<typeof mealSchema>;

export type MealItem = { ingredient: Ingredient; amount: number };

export type MealDetail = {
	id: number;
	name: string;
	photo: string | null;
	preparation: string | null;
	types: MealTypeKey[];
	items: MealItem[];
};

/** A row of the meals list and the meal picker; `base` is one average portion. */
export type MealListItem = {
	id: number;
	name: string;
	photo: string | null;
	types: MealTypeKey[];
	base: Nutrition;
};

/** One page of `GET /api/meals`; `nextCursor` is `null` on the last page. */
export type MealListPage = { items: MealListItem[]; nextCursor: string | null };

/** Reads the meal form fields (everything except the photo) for `mealSchema`. */
export function readMealForm(form: FormData) {
	const get = (key: string) => {
		const value = form.get(key);
		return typeof value === 'string' ? value : '';
	};
	return {
		name: get('name'),
		types: form.getAll('types').filter((t) => typeof t === 'string'),
		items: get('items'),
		preparation: get('preparation')
	};
}
