import { readIngredientsQuery } from './ingredients-query';
import { encodeCursor } from './pagination';

test('readIngredientsQuery trims the search and ignores bad cursors', () => {
	const url = new URL('http://x/api/ingredients?q=%20jajko%20&cursor=%25%25');
	expect(readIngredientsQuery(url)).toEqual({ q: 'jajko', cursor: null });
	const cursor = encodeCursor({ name: 'Ryż', id: 4 });
	expect(readIngredientsQuery(new URL(`http://x/api/ingredients?cursor=${cursor}`))).toEqual({
		q: '',
		cursor: { name: 'Ryż', id: 4 }
	});
});

test('readIngredientsQuery ignores a search shorter than two characters', () => {
	expect(readIngredientsQuery(new URL('http://x/api/ingredients?q=j')).q).toBe('');
});
