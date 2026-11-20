import type { User } from '$lib/config/users';
import type { PlanMeal } from '$lib/plan';

/** One shopping-list position built from the plan, in the ingredient's unit. */
export type BuiltItem = { ingredientId: number; amount: number };

/** A row already on the list. Manual items have no `ingredientId`. */
export type ExistingItem = {
	id: number;
	ingredientId: number | null;
	amount: number | null;
	done: boolean;
};

export type ListCreation =
	| { kind: 'needs-mode' }
	| { kind: 'rebuild'; insert: BuiltItem[] }
	| { kind: 'merge'; updates: { id: number; amount: number }[]; insert: BuiltItem[] };

/** The list stores amounts as DECIMAL(10,2). */
function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

/**
 * Sums `amount × Σ multipliers of non-excluded users` per ingredient. A meal everyone skips adds
 * nothing, and amounts that end up ≤ 0 are dropped. Sorted by `ingredientId`.
 */
export function buildFromPlan(
	meals: Pick<PlanMeal, 'items' | 'excludedUserKeys'>[],
	users: readonly User[]
): BuiltItem[] {
	const totals = new Map<number, number>();
	for (const meal of meals) {
		const factor = users
			.filter((u) => !meal.excludedUserKeys.includes(u.key))
			.reduce((sum, u) => sum + u.multiplier, 0);
		if (factor <= 0) continue;
		for (const item of meal.items) {
			const id = item.ingredient.id;
			totals.set(id, (totals.get(id) ?? 0) + item.amount * factor);
		}
	}
	return [...totals]
		.map(([ingredientId, amount]) => ({ ingredientId, amount: round2(amount) }))
		.filter((item) => item.amount > 0)
		.toSorted((a, b) => a.ingredientId - b.ingredientId);
}

/**
 * Decides how to write a list built from the plan. With no open (not done) items the list is
 * rebuilt; otherwise the caller must choose `merge` or `replace`. Merging adds to open items built
 * from the plan with the same ingredient and leaves manual and done items untouched.
 */
export function planListCreation(
	existing: ExistingItem[],
	built: BuiltItem[],
	mode?: 'merge' | 'replace'
): ListCreation {
	const open = existing.filter((item) => !item.done);
	if (open.length === 0 || mode === 'replace') return { kind: 'rebuild', insert: built };
	if (mode !== 'merge') return { kind: 'needs-mode' };

	const updates: { id: number; amount: number }[] = [];
	const insert: BuiltItem[] = [];
	for (const item of built) {
		const match = open.find((e) => e.ingredientId === item.ingredientId);
		if (match) updates.push({ id: match.id, amount: round2((match.amount ?? 0) + item.amount) });
		else insert.push(item);
	}
	return { kind: 'merge', updates, insert };
}
