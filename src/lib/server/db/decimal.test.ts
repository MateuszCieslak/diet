import { toNum, toNumOrNull } from './decimal';

test('toNum converts DECIMAL strings', () => {
	expect(toNum('12.50')).toBe(12.5);
	expect(toNumOrNull(null)).toBeNull();
	expect(toNumOrNull('0.00')).toBe(0);
});
