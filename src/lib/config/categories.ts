/** Ingredient categories, in display order (shopping list groups follow this order). */
export const categories = [
	'vegetables',
	'fruit',
	'dairy',
	'meat',
	'fish',
	'grains',
	'bakery',
	'spices',
	'fats',
	'drinks',
	'other'
] as const;

export type CategoryKey = (typeof categories)[number];
