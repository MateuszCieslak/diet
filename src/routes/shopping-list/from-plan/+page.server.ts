import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { env } from '$env/dynamic/private';
import { users } from '$lib/config/users';
import { dateRange, todayIn } from '$lib/dates';
import { pl } from '$lib/i18n/pl';
import { getPlanForDates } from '$lib/server/repositories/plan';
import {
	applyListCreation,
	getExistingItems,
	getLastPlannedDate
} from '$lib/server/repositories/shopping';
import { buildFromPlan, planListCreation } from '$lib/shopping';
import type { Actions, PageServerLoad } from './$types';

const createSchema = v.object({
	planMealIds: v.array(v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(1))),
	mode: v.optional(v.picklist(['merge', 'replace']))
});

/** Planned meals from today through the last planned day. */
async function upcomingMeals() {
	const today = todayIn(env.TZ ?? 'Europe/Warsaw');
	const last = await getLastPlannedDate(today);
	return last ? getPlanForDates(dateRange(today, last)) : [];
}

export const load: PageServerLoad = async () => {
	const [meals, existing] = await Promise.all([upcomingMeals(), getExistingItems()]);
	const days: { date: string; meals: { id: number; name: string }[] }[] = [];
	for (const meal of meals) {
		let day = days.at(-1);
		if (day?.date !== meal.date) {
			day = { date: meal.date, meals: [] };
			days.push(day);
		}
		day.meals.push({ id: meal.id, name: meal.name });
	}
	return { days, hasOpenItems: existing.some((item) => !item.done) };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const parsed = v.safeParse(createSchema, {
			planMealIds: form.getAll('planMealIds'),
			mode: form.get('mode') || undefined
		});
		if (!parsed.success) return fail(400, { error: pl.shoppingFromPlan.failed });

		// Only meals still planned from today on count; stale or past ids are ignored.
		const selected = new Set(parsed.output.planMealIds);
		const meals = (await upcomingMeals()).filter((m) => selected.has(m.id));
		if (meals.length === 0) return fail(400, { error: pl.errors.nothingSelected });

		const creation = planListCreation(
			await getExistingItems(),
			buildFromPlan(meals, users),
			parsed.output.mode
		);
		if (creation.kind === 'needs-mode') return fail(409, { needsMode: true as const });
		await applyListCreation(creation);
		redirect(303, '/shopping-list');
	}
};
