import { readMealsQuery } from './meals-query';
import { encodeCursor } from './pagination';

test('readMealsQuery trims the search and ignores unknown types and bad cursors', () => {
	const url = new URL('http://x/api/meals?q=%20owsianka%20&type=lunch&cursor=%25%25');
	expect(readMealsQuery(url)).toEqual({ q: 'owsianka', type: 'lunch', cursor: null });
	expect(readMealsQuery(new URL('http://x/api/meals?type=brunch'))).toEqual({
		q: '',
		type: undefined,
		cursor: null
	});
	const cursor = encodeCursor({ name: 'Żurek', id: 7 });
	expect(readMealsQuery(new URL(`http://x/api/meals?cursor=${cursor}`)).cursor).toEqual({
		name: 'Żurek',
		id: 7
	});
});

test('readMealsQuery ignores a search shorter than two characters', () => {
	expect(readMealsQuery(new URL('http://x/api/meals?q=o')).q).toBe('');
});
