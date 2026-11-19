import type { CategoryKey } from '$lib/config/categories';
import type { MealTypeKey } from '$lib/config/meal-types';
import type { Unit } from '$lib/config/units';

/** All user-facing strings (Polish). Later tasks add keys as they need them. */
export const pl = {
	appName: 'Dieta',
	nav: {
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
