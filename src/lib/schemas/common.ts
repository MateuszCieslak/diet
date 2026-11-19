import * as v from 'valibot';
import { pl } from '$lib/i18n/pl';

const numberFormat = new Intl.NumberFormat('pl-PL');

/**
 * A decimal number typed by the user. Accepts `,` or `.` as the separator (Polish users type
 * `1,5`) and at most 2 decimals. By default the value must be greater than 0; `allowZero` allows 0
 * and `min` sets an inclusive lower bound instead.
 */
export function decimalInput(opts: { min?: number; allowZero?: boolean } = {}) {
	const { min, allowZero = false } = opts;
	const bound =
		min !== undefined
			? v.check((n: number) => n >= min, pl.errors.min(numberFormat.format(min)))
			: allowZero
				? v.check((n: number) => n >= 0, pl.errors.min('0'))
				: v.check((n: number) => n > 0, pl.errors.positive);
	return v.pipe(
		v.union([v.string(), v.number()], pl.errors.number),
		v.transform((input) => (typeof input === 'number' ? String(input) : input.trim())),
		v.nonEmpty(pl.errors.required),
		v.regex(/^\d+([.,]\d+)?$/, pl.errors.number),
		v.regex(/^\d+([.,]\d{1,2})?$/, pl.errors.maxDecimals),
		v.transform((input) => Number(input.replace(',', '.'))),
		bound
	);
}

/** Like `decimalInput`, but an empty (or missing) value becomes `undefined`. */
export function optionalDecimalInput(opts: { min?: number; allowZero?: boolean } = {}) {
	return v.pipe(
		v.nullish(v.union([v.string(), v.number()], pl.errors.number)),
		v.transform((input) =>
			input === null || (typeof input === 'string' && input.trim() === '') ? undefined : input
		),
		v.optional(decimalInput(opts))
	);
}

export const nameMaxLength = 120;

/** A name (meal, ingredient, shopping item): trimmed, 1 to 120 characters. */
export const nameInput = v.pipe(
	v.string(pl.errors.required),
	v.trim(),
	v.nonEmpty(pl.errors.required),
	v.maxLength(nameMaxLength, pl.errors.maxLength(nameMaxLength))
);

/**
 * Flattens valibot issues to the first message per field, keyed by the dotted path
 * (`name`, `ingredients.0.amount`). Issues without a path go under `form`.
 */
export function formErrors(issues: readonly v.BaseIssue<unknown>[]): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const issue of issues) {
		const key = v.getDotPath(issue) ?? 'form';
		errors[key] ??= issue.message || pl.errors.invalid;
	}
	return errors;
}
