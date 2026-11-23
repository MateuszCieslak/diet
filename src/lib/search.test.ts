import { searchTerm } from './search';

test('searchTerm ignores queries shorter than two characters', () => {
	expect(searchTerm('')).toBe('');
	expect(searchTerm('j')).toBe('');
	expect(searchTerm('  j  ')).toBe('');
});

test('searchTerm returns the trimmed query from two characters', () => {
	expect(searchTerm('ja')).toBe('ja');
	expect(searchTerm('  ryż ')).toBe('ryż');
});
