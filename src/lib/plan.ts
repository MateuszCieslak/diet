import type { MealItem } from '$lib/schemas/meal';

/** A meal copied into the plan for one day. Editing it never changes the source meal. */
export type PlanMeal = {
	id: number;
	date: string;
	position: number;
	sourceMealId: number | null;
	name: string;
	photo: string | null;
	preparation: string | null;
	items: MealItem[];
	excludedUserKeys: string[];
};

/** A new order must list exactly the day's current ids: same set, same length, no duplicates. */
export function isValidReorder(currentIds: number[], newIds: number[]): boolean {
	if (newIds.length !== currentIds.length) return false;
	const current = new Set(currentIds);
	const seen = new Set<number>();
	for (const id of newIds) {
		if (!current.has(id) || seen.has(id)) return false;
		seen.add(id);
	}
	return true;
}
