import * as v from 'valibot';
import { pl } from '$lib/i18n/pl';
import { decimalInput } from './common';

export const maxPortions = 99;

/** Portions of a planned meal: positive, at most 2 decimals (DECIMAL(5,2)), at most 99. */
export const portionsInput = v.pipe(
	decimalInput(),
	v.maxValue(maxPortions, pl.errors.max(String(maxPortions)))
);
