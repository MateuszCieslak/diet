import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { env } from '$env/dynamic/private';
import { users } from '$lib/config/users';
import { isIsoDate, todayIn, weekOf } from '$lib/dates';
import { pl } from '$lib/i18n/pl';
import {
	ExcludedUserError,
	PlanNotFoundError,
	addMealToDay,
	getPlanForDates,
	getSourceMealTypes,
	removePlanMeal,
	reorderDay,
	replacePlanMeal,
	toggleEaten,
	toggleExclusion
} from '$lib/server/repositories/plan';
import type { Actions, PageServerLoad } from './$types';

const idInput = v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(1));
const dateInput = v.pipe(v.string(), v.check(isIsoDate));

const schemas = {
	add: v.object({ date: dateInput, mealId: idInput }),
	replace: v.object({ planMealId: idInput, mealId: idInput }),
	remove: v.object({ planMealId: idInput }),
	toggleExclusion: v.object({
		planMealId: idInput,
		userKey: v.picklist(users.map((u) => u.key))
	}),
	toggleEaten: v.object({
		planMealId: idInput,
		userKey: v.picklist(users.map((u) => u.key))
	}),
	reorder: v.object({
		date: dateInput,
		ids: v.pipe(v.string(), v.parseJson(), v.array(v.pipe(v.number(), v.integer(), v.minValue(1))))
	})
};

/** Parses the posted fields, or returns `null` when the request is malformed. */
async function read<S extends v.GenericSchema>(request: Request, schema: S) {
	const form = Object.fromEntries(await request.formData());
	const parsed = v.safeParse(schema, form);
	return parsed.success ? (parsed.output as v.InferOutput<S>) : null;
}

const invalid = () => fail(400, { error: pl.plan.actionFailed });

/** Maps a vanished meal or planned meal to a form error; rethrows anything else. */
async function run(action: () => Promise<void>) {
	try {
		await action();
	} catch (e) {
		if (e instanceof PlanNotFoundError) return fail(404, { error: pl.plan.mealMissing });
		throw e;
	}
}

export const load: PageServerLoad = async ({ url }) => {
	const today = todayIn(env.TZ ?? 'Europe/Warsaw');
	const param = url.searchParams.get('date');
	const date = param && isIsoDate(param) ? param : today;
	const week = weekOf(date);
	const meals = await getPlanForDates(week);
	const types = await getSourceMealTypes(
		meals.flatMap((m) => (m.sourceMealId === null ? [] : [m.sourceMealId]))
	);
	return { date, today, week, meals, types };
};

export const actions: Actions = {
	add: async ({ request }) => {
		const data = await read(request, schemas.add);
		if (!data) return invalid();
		return run(() => addMealToDay(data.date, data.mealId));
	},
	replace: async ({ request }) => {
		const data = await read(request, schemas.replace);
		if (!data) return invalid();
		return run(() => replacePlanMeal(data.planMealId, data.mealId));
	},
	remove: async ({ request }) => {
		const data = await read(request, schemas.remove);
		if (!data) return invalid();
		await removePlanMeal(data.planMealId);
	},
	toggleExclusion: async ({ request }) => {
		const data = await read(request, schemas.toggleExclusion);
		if (!data) return invalid();
		return run(() => toggleExclusion(data.planMealId, data.userKey));
	},
	toggleEaten: async ({ request }) => {
		const data = await read(request, schemas.toggleEaten);
		if (!data) return invalid();
		try {
			return await run(() => toggleEaten(data.planMealId, data.userKey));
		} catch (e) {
			// The person was excluded in the meantime (e.g. on the other phone).
			if (e instanceof ExcludedUserError) return invalid();
			throw e;
		}
	},
	reorder: async ({ request }) => {
		const data = await read(request, schemas.reorder);
		if (!data || !(await reorderDay(data.date, data.ids))) return invalid();
	}
};
