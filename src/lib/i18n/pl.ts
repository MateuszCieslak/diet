import type { CategoryKey } from '$lib/config/categories';
import type { MealTypeKey } from '$lib/config/meal-types';
import type { Unit } from '$lib/config/units';

/** All user-facing strings (Polish). Later tasks add keys as they need them. */
export const pl = {
	appName: 'Dieta',
	common: {
		close: 'Zamknij',
		back: 'Wstecz',
		save: 'Zapisz',
		cancel: 'Anuluj',
		search: 'Szukaj',
		new: 'Nowy'
	},
	errors: {
		required: 'To pole jest wymagane',
		number: 'Wpisz liczbę, np. 1,5',
		maxDecimals: 'Najwyżej 2 miejsca po przecinku',
		positive: 'Wartość musi być większa od 0',
		min: (min: string) => `Wartość nie może być mniejsza niż ${min}`,
		maxLength: (max: number) => `Najwyżej ${max} znaków`,
		max: (max: string) => `Wartość nie może być większa niż ${max}`,
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
	ingredients: {
		title: 'Składniki',
		newTitle: 'Nowy składnik',
		editTitle: 'Edytuj składnik',
		searchLabel: 'Szukaj składnika',
		searchPlaceholder: 'np. jajko',
		empty: 'Nie ma jeszcze żadnych składników.',
		noResults: 'Brak składników pasujących do wyszukiwania.',
		name: 'Nazwa',
		unit: 'Jednostka',
		unitLocked: 'Jednostki nie można zmienić. Aby użyć innej, utwórz nowy składnik.',
		category: 'Kategoria',
		categoryPlaceholder: 'Wybierz kategorię',
		nutritionLabel: (unit: Unit) =>
			unit === 'pcs' ? 'Wartości odżywcze na 1 szt.' : `Wartości odżywcze na 100 ${unit}`,
		kcal: 'Kalorie (kcal)',
		protein: 'Białko (g)',
		fat: 'Tłuszcz (g)',
		carbs: 'Węglowodany (g)',
		macros: (protein: string, fat: string, carbs: string) => `B ${protein} · T ${fat} · W ${carbs}`,
		kcalPerUnit: (kcal: string, unit: Unit) =>
			unit === 'pcs' ? `${kcal} kcal / szt.` : `${kcal} kcal / 100 ${unit}`,
		nameTaken: 'Składnik o tej nazwie już istnieje',
		hide: 'Usuń składnik',
		hideTitle: 'Usunąć składnik?',
		hideConfirm: 'Usuń',
		hideNote:
			'Składnik zniknie z listy i wyszukiwania. Posiłki, plan i lista zakupów, które go używają, zostaną bez zmian.'
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
