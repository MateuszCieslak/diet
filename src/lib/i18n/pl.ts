import type { CategoryKey } from '$lib/config/categories';
import type { MealTypeKey } from '$lib/config/meal-types';
import type { Unit } from '$lib/config/units';

/** All user-facing strings (Polish). Later tasks add keys as they need them. */
export const pl = {
	appName: 'Dieta',
	common: {
		close: 'Zamknij'
	},
	errors: {
		required: 'To pole jest wymagane',
		number: 'Wpisz liczbę, np. 1,5',
		maxDecimals: 'Najwyżej 2 miejsca po przecinku',
		positive: 'Wartość musi być większa od 0',
		min: (min: string) => `Wartość nie może być mniejsza niż ${min}`,
		maxLength: (max: number) => `Najwyżej ${max} znaków`,
		invalid: 'Nieprawidłowa wartość'
	},
	nav: {
		label: 'Nawigacja główna',
		plan: 'Plan',
		meals: 'Posiłki',
		ingredients: 'Składniki',
		shopping: 'Zakupy'
	},
	login: {
		title: 'Zaloguj się',
		password: 'Hasło',
		submit: 'Zaloguj',
		wrongPassword: 'Nieprawidłowe hasło.',
		tooManyAttempts: 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.'
	},
	units: {
		g: 'g',
		ml: 'ml',
		pcs: 'szt.'
	} satisfies Record<Unit, string>,
	categories: {
		vegetables: 'Warzywa',
		fruit: 'Owoce',
		dairy: 'Nabiał',
		meat: 'Mięso',
		fish: 'Ryby',
		grains: 'Produkty zbożowe',
		bakery: 'Pieczywo',
		spices: 'Przyprawy',
		fats: 'Tłuszcze',
		drinks: 'Napoje',
		other: 'Inne'
	} satisfies Record<CategoryKey, string>,
	mealTypes: {
		breakfast: 'Śniadanie',
		second_breakfast: 'Drugie śniadanie',
		lunch: 'Obiad',
		dinner: 'Kolacja',
		snack: 'Przekąska'
	} satisfies Record<MealTypeKey, string>
};
