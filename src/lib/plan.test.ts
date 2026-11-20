import { isValidReorder } from './plan';

test('isValidReorder', () => {
	expect(isValidReorder([1, 2, 3], [3, 1, 2])).toBe(true);
	expect(isValidReorder([1, 2, 3], [1, 2])).toBe(false);
	expect(isValidReorder([1, 2, 3], [1, 1, 2])).toBe(false);
	expect(isValidReorder([1, 2, 3], [1, 2, 4])).toBe(false);
});
