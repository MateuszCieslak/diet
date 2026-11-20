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

/** A manual item from the quick-add row: a name and, optionally, an amount and a unit. */
export const manualItemSchema = v.object({
	name: nameInput,
	amount: v.optional(v.pipe(v.unknown(), blankToUndefined, v.optional(amountInput))),
	unit: v.optional(
		v.pipe(v.unknown(), blankToUndefined, v.optional(v.picklist(units, pl.errors.invalid)))
	)
});

export type ManualItemInput = v.InferOutput<typeof manualItemSchema>;

/** `PATCH` body: tick or untick an item and/or change its amount (`null` clears a manual amount). */
export const itemPatchSchema = v.pipe(
	v.object({
		done: v.optional(v.boolean(pl.errors.invalid)),
		amount: v.optional(v.nullable(amountInput))
	}),
	v.check((patch) => patch.done !== undefined || patch.amount !== undefined, pl.errors.invalid)
);

export type ItemPatch = v.InferOutput<typeof itemPatchSchema>;
