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
	'alcohol',
	'household',
	'other'
] as const;

export type CategoryKey = (typeof categories)[number];
