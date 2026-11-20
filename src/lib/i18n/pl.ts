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
		invalid: 'Nieprawidłowa wartość',
		nameTaken: 'Posiłek o tej nazwie już istnieje',
		nothingSelected: 'Wybierz co najmniej jeden posiłek'
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
	meals: {
		title: 'Posiłki',
		searchLabel: 'Szukaj posiłku',
		searchPlaceholder: 'Szukaj posiłku, np. owsianka',
		allTypes: 'Wszystkie',
		empty: 'Nie ma jeszcze żadnych posiłków.',
		noResults: 'Brak posiłków pasujących do wyszukiwania.',
		loadFailed: 'Nie udało się wczytać posiłków.',
		retry: 'Spróbuj ponownie',
		loading: 'Wczytywanie…',
		kcalPerPortion: (kcal: string) => `${kcal} kcal / porcja`,
		newTitle: 'Nowy posiłek',
		editTitle: 'Edytuj posiłek',
		edit: 'Edytuj',
		name: 'Nazwa',
		namePlaceholder: 'np. Owsianka z jabłkiem',
		types: 'Rodzaj posiłku',
		typesRequired: 'Wybierz co najmniej jeden rodzaj posiłku',
		photo: 'Zdjęcie',
		photoAdd: 'Dodaj zdjęcie',
		photoChange: 'Zmień zdjęcie',
		photoHint: 'JPG, PNG lub HEIC, do 10 MB',
		photoTooLarge: 'Zdjęcie jest za duże (najwyżej 10 MB)',
		photoInvalid: 'Nie udało się wczytać zdjęcia. Wybierz plik JPG, PNG lub WebP.',
		photoAlt: (name: string) => `Zdjęcie: ${name}`,
		ingredients: 'Składniki',
		itemsRequired: 'Dodaj co najmniej jeden składnik',
		itemsMissing: 'Jeden ze składników już nie istnieje. Usuń go i dodaj ponownie.',
		removeItem: (name: string) => `Usuń składnik ${name}`,
		amountFor: (name: string) => `Ilość: ${name}`,
		ingredientSearch: 'Dodaj składnik',
		ingredientSearchPlaceholder: 'Szukaj składnika, np. jajko',
		ingredientNoResults: 'Brak pasujących składników.',
		ingredientAdded: 'dodany',
		ingredientSearchFailed: 'Nie udało się wyszukać składników.',
		perPortion: 'Na porcję',
		preparation: 'Przygotowanie',
		preparationPlaceholder: 'Opisz kolejne kroki…',
		amountsPerUser: 'Ilości na osobę',
		ingredient: 'Składnik',
		nutrition: 'Wartości odżywcze',
		delete: 'Usuń posiłek',
		deleteTitle: 'Usunąć posiłek?',
		deleteConfirm: 'Usuń',
		deleteNote: 'Posiłek zniknie z bazy. Posiłki już dodane do planu zostaną bez zmian.'
	},
	plan: {
		title: 'Plan',
		previousWeek: 'Poprzedni tydzień',
		nextWeek: 'Następny tydzień',
		today: 'Dziś',
		week: 'Dni tygodnia',
		/** Monday first, matching `weekOf`. */
		weekdaysShort: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'],
		hasMeals: 'zaplanowane posiłki',
		daySummary: 'Podsumowanie dnia',
		meals: 'Posiłki',
		empty: 'Na ten dzień nie ma jeszcze posiłków.',
		addMeal: 'Dodaj posiłek',
		replaceMeal: 'Zamień posiłek',
		dragHandle: 'Przeciągnij, aby zmienić kolejność',
		menu: (name: string) => `Opcje: ${name}`,
		replace: 'Zamień',
		edit: 'Edytuj',
		remove: 'Usuń',
		removeTitle: (name: string) => `Usunąć „${name}” z tego dnia?`,
		eats: (name: string) => `${name} je ten posiłek`,
		notEating: 'nie je',
		tapToAdd: 'Dotknij, aby dodać',
		actionFailed: 'Nie udało się zapisać zmiany. Odśwież stronę i spróbuj ponownie.',
		mealMissing: 'Tego posiłku już nie ma.'
	},
	cooking: {
		edit: 'Edytuj posiłek w planie',
		ingredient: 'Składnik',
		ingredients: 'Składniki',
		kcalPerPortion: 'kcal / porcja',
		allExcluded: 'Nikt nie je tego posiłku. Dotknij osoby na planie, aby ją dodać.',
		preparation: 'Przygotowanie'
	},
	shoppingFromPlan: {
		title: 'Lista z planu',
		selectDay: (day: string) => `Wybierz cały dzień: ${day}`,
		selected: (count: number) =>
			count === 1
				? '1 posiłek'
				: count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)
					? `${count} posiłki`
					: `${count} posiłków`,
		create: 'Utwórz listę zakupów',
		empty: 'Od dziś nie ma zaplanowanych posiłków.',
		goToPlan: 'Przejdź do planu',
		modeTitle: 'Na liście są niekupione produkty',
		modeNote:
			'Połącz: dodaj nowe ilości do obecnej listy. Zastąp: wyczyść listę i utwórz ją od nowa.',
		merge: 'Połącz',
		replace: 'Zastąp',
		failed: 'Nie udało się utworzyć listy. Odśwież stronę i spróbuj ponownie.'
	},
	planEdit: {
		title: 'Edytuj posiłek w planie',
		note: 'Zmiany dotyczą tylko tego dnia. Przepis w bazie posiłków pozostaje bez zmian.',
		saveAsRecipe: 'Zapisz jako nowy przepis',
		saveAsRecipeTitle: 'Nowy przepis',
		saveAsRecipeNote:
			'Wybierz rodzaj posiłku. Nazwa, składniki, przygotowanie i zdjęcie zostaną skopiowane.',
		saveAsRecipeConfirm: 'Utwórz przepis',
		recipeSaved: (name: string) => `Zapisano przepis „${name}”.`,
		openRecipe: 'Zobacz przepis',
		recipeFailed: 'Nie udało się utworzyć przepisu. Popraw zaznaczone pola powyżej.',
		reorderFailed: 'Nie udało się zmienić kolejności. Spróbuj ponownie.'
	},
	shopping: {
		title: 'Zakupy',
		fromPlan: 'Z planu',
		addLabel: 'Dodaj do listy',
		name: 'Nazwa',
		namePlaceholder: 'Dodaj coś…',
		amount: 'Ilość',
		unit: 'Jednostka',
		noUnit: '—',
		suggestions: 'Pasujące składniki',
		empty: 'Lista jest pusta. Utwórz ją z planu albo dodaj coś powyżej.',
		done: (count: number) => `Kupione (${count})`,
		tick: (name: string) => `Oznacz jako kupione: ${name}`,
		untick: (name: string) => `Przywróć na listę: ${name}`,
		editAmount: (name: string) => `Zmień ilość: ${name}`,
		amountFor: (name: string) => `Ilość: ${name}`,
		saveFailed: 'Nie udało się zapisać zmiany. Sprawdź połączenie i spróbuj ponownie.',
		addFailed: 'Nie udało się dodać pozycji. Sprawdź połączenie i spróbuj ponownie.'
	},
	nutrition: {
		person: 'Osoba',
		kcal: 'kcal',
		protein: 'Białko',
		fat: 'Tłuszcz',
		carbs: 'Węgl.',
		proteinShort: 'B',
		fatShort: 'T',
		carbsShort: 'W',
		excluded: '—'
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
