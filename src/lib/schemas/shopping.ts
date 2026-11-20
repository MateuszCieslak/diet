import * as v from 'valibot';
import { units } from '$lib/config/units';
import { pl } from '$lib/i18n/pl';
import { decimalInput, nameInput } from './common';

/** The largest value the `decimal(10,2)` list amount column holds. */
export const shoppingAmountMax = 99999999.99;

const amountInput = v.pipe(
	decimalInput(),
	v.maxValue(shoppingAmountMax, pl.errors.max('99 999 999,99'))
);

/** Empty strings and `null` (an unfilled form field) become `undefined`. */
const blankToUndefined = v.transform((input: unknown) =>
	input === null || (typeof input === 'string' && input.trim() === '') ? undefined : input
);

const optionalAmount = v.optional(v.pipe(v.unknown(), blankToUndefined, v.optional(amountInput)));

/** A manual item from the quick-add row: a name and, optionally, an amount and a unit. */
export const manualItemSchema = v.object({
	name: nameInput,
	amount: optionalAmount,
	unit: v.optional(
		v.pipe(v.unknown(), blankToUndefined, v.optional(v.picklist(units, pl.errors.invalid)))
	)
});

export type ManualItemInput = v.InferOutput<typeof manualItemSchema>;

/** A suggestion picked in the quick-add row: an ingredient and, optionally, an amount in its unit. */
export const ingredientItemSchema = v.object({
	ingredientId: v.pipe(
		v.number(pl.errors.invalid),
		v.integer(pl.errors.invalid),
		v.minValue(1, pl.errors.invalid)
	),
	amount: optionalAmount
});

export type IngredientItemInput = v.InferOutput<typeof ingredientItemSchema>;

/** `POST` body of the quick-add row: a picked ingredient or a manual item. */
export const quickAddSchema = v.union([ingredientItemSchema, manualItemSchema], pl.errors.invalid);

export type QuickAddInput = v.InferOutput<typeof quickAddSchema>;

/** `PATCH` body: tick or untick an item and/or change its amount (`null` clears the amount). */
export const itemPatchSchema = v.pipe(
	v.object({
		done: v.optional(v.boolean(pl.errors.invalid)),
		amount: v.optional(v.nullable(amountInput))
	}),
	v.check((patch) => patch.done !== undefined || patch.amount !== undefined, pl.errors.invalid)
);

export type ItemPatch = v.InferOutput<typeof itemPatchSchema>;
