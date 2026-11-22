import * as v from 'valibot';
import { pl } from '$lib/i18n/pl';
import { portionsInput } from './plan';

const parse = (input: string) => v.safeParse(portionsInput, input);

test('portionsInput accepts positive numbers up to 99 with a comma', () => {
	expect(parse('2').output).toBe(2);
	expect(parse('1,5').output).toBe(1.5);
	expect(parse('99').output).toBe(99);
});

test('portionsInput rejects zero, unfinished, too large and too precise values', () => {
	const accepted = ['0', '1,', '100', '1,555', '', 'abc'].filter((bad) => parse(bad).success);
	expect(accepted).toEqual([]);
});

test('portions badge text uses the right Polish form', () => {
	expect(pl.plan.portions(1)).toBe('1 porcja');
	expect(pl.plan.portions(2)).toBe('2 porcje');
	expect(pl.plan.portions(5)).toBe('5 porcji');
	expect(pl.plan.portions(12)).toBe('12 porcji');
	expect(pl.plan.portions(22)).toBe('22 porcje');
	expect(pl.plan.portions(1.5)).toBe('1,5 porcji');
});
