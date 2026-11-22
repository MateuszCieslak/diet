import { initialReplacementAmount, matchKcalAmount, parseAmountInput } from './item-edit';

const oats = { unit: 'g', kcal: 366, protein: 12, fat: 7, carbs: 69 } as const;
const egg = { unit: 'pcs', kcal: 78, protein: 7, fat: 5, carbs: 0 } as const;

test('parseAmountInput accepts positive numbers with a comma or dot', () => {
	expect(parseAmountInput('1,5')).toBe(1.5);
	expect(parseAmountInput(' 120 ')).toBe(120);
	expect(parseAmountInput('0.5')).toBe(0.5);
	expect(parseAmountInput('1,')).toBeNull();
	expect(parseAmountInput('0')).toBeNull();
	expect(parseAmountInput('abc')).toBeNull();
	expect(parseAmountInput('')).toBeNull();
});

test('initialReplacementAmount keeps the amount only for the same unit', () => {
	expect(initialReplacementAmount('g', 'g', 50)).toBe(50);
	expect(initialReplacementAmount('g', 'pcs', 50)).toBeNull();
});

test('matchKcalAmount rounds grams to integers and pieces to one decimal', () => {
	expect(matchKcalAmount(183, oats)).toBe(50); // 183 / 366 × 100
	expect(matchKcalAmount(100, oats)).toBe(27); // 27.3
	expect(matchKcalAmount(100, egg)).toBe(1.3); // 1.28
});

test('matchKcalAmount gives null when kcal cannot be matched', () => {
	expect(matchKcalAmount(100, { ...oats, kcal: 0 })).toBeNull();
	expect(matchKcalAmount(0, oats)).toBeNull();
});

test('matchKcalAmount never rounds down to zero', () => {
	expect(matchKcalAmount(1, oats)).toBe(1); // 0.27 g
	expect(matchKcalAmount(1, egg)).toBe(0.1); // 0.01 pcs
});

test('matchKcalAmount pieces have no float noise', () => {
	expect(matchKcalAmount(78 * 3.7, egg)).toBe(3.7);
});

test('parseAmountInput allows at most two decimals, like the database column', () => {
	expect(parseAmountInput('1,55')).toBe(1.55);
	expect(parseAmountInput('1,555')).toBeNull();
	expect(parseAmountInput('0,004')).toBeNull();
});
