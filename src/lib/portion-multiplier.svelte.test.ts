import { loadPortionMultiplier, savePortionMultiplier } from './portion-multiplier';

afterEach(() => {
	localStorage.clear();
	vi.restoreAllMocks();
});

test('a saved multiplier is loaded again for the same planned meal only', () => {
	savePortionMultiplier(7, 2.5);
	expect(loadPortionMultiplier(7)).toBe(2.5);
	expect(loadPortionMultiplier(8)).toBe(1);
});

test('saving 1 forgets the value', () => {
	savePortionMultiplier(7, 2);
	savePortionMultiplier(7, 1);
	expect(localStorage.length).toBe(0);
	expect(loadPortionMultiplier(7)).toBe(1);
});

test('junk in storage falls back to 1', () => {
	localStorage.setItem('diet:portionMultiplier:7', 'abc');
	expect(loadPortionMultiplier(7)).toBe(1);
	localStorage.setItem('diet:portionMultiplier:7', '-2');
	expect(loadPortionMultiplier(7)).toBe(1);
});

test('blocked storage does not throw', () => {
	vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
		throw new Error('blocked');
	});
	vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
		throw new Error('blocked');
	});
	expect(loadPortionMultiplier(7)).toBe(1);
	expect(() => savePortionMultiplier(7, 2)).not.toThrow();
});
