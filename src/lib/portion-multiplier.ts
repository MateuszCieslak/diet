// The cooking view's portion multiplier is a per-device convenience, so it lives in localStorage,
// one value per planned meal. Storage can be unavailable (private mode, blocked site data), so
// every access is guarded and the default is 1.

const key = (planMealId: number) => `diet:portionMultiplier:${planMealId}`;

export function loadPortionMultiplier(planMealId: number): number {
	try {
		const value = Number(localStorage.getItem(key(planMealId)));
		return Number.isFinite(value) && value > 0 ? value : 1;
	} catch {
		return 1;
	}
}

/** Saving 1 removes the entry: the default needs no storage. */
export function savePortionMultiplier(planMealId: number, value: number): void {
	try {
		if (value === 1) localStorage.removeItem(key(planMealId));
		else localStorage.setItem(key(planMealId), String(value));
	} catch {
		// Not saved; the multiplier still works for this visit.
	}
}
