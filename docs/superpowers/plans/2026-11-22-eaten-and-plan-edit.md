# Eaten Meals and Plan Ingredient Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each person mark planned meals as eaten (day summary shows eaten / planned kcal) and replace the plan edit page's ingredient rows with a list plus an edit popup that compares old vs new nutrition and can match kcal.

**Architecture:** Part 1 adds a `plan_meal_eaten` table mirroring `plan_meal_exclusions`, a `toggleEaten` action on `/plan`, a check button per person tile and an eaten-kcal figure in the day summary. Part 2 is client-only: pure helpers in `src/lib/item-edit.ts`, a new `ItemEditDialog` component, and `MealForm` rendering a list in `planMeal` mode; saving still goes through the existing `save` action.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Drizzle ORM + MySQL 8, valibot, Vitest (server + browser projects).

**Spec:** `docs/superpowers/specs/2026-11-22-eaten-and-plan-edit-design.md`

## Global Constraints

- All UI strings in `src/lib/i18n/pl.ts`; no hardcoded text in components. Code and comments in English.
- Colors/spacing/fonts from `src/lib/styles/base.css` variables; no hex in components. Per-person colors from `users.ts`.
- Touch targets ≥ 44×44px; icon-only buttons get `aria-label`; toggles use `aria-pressed`.
- Shared constants camelCase. Never assume exactly two users.
- Schema changes: edit `src/lib/server/db/schema.ts`, run `pnpm db:generate`, review the SQL, commit it in `drizzle/`.
- Before each commit: `pnpm lint && pnpm format:check && pnpm check && pnpm test`.
- Toolchain on this machine: `export PATH=$HOME/.local/share/mise/installs/pnpm/10.33.0:$HOME/.nvm/versions/node/v22.23.4/bin:$PATH`.

## Review Focus

1. Excluding a person who is marked eaten → their eaten mark disappears (no eaten kcal for someone who does not eat the meal). Test: Task 2 Step 1 (`dayEatenKcal` ignores excluded) + Task 1 repository rule.
2. Replacing with an ingredient of a different unit (g → pcs) → new amount starts empty, comparison shows 0 for "Będzie" until typed. Test: Task 4 `initialReplacementAmount`.
3. "Dopasuj kcal" with a 0-kcal ingredient (water, erythritol) or 0 old kcal → button disabled, no NaN/Infinity amount. Test: Task 4 `matchKcalAmount` returns `null`.
4. Amount typed with a Polish comma (`1,5`) or unfinished (`1,`) → parsed as 1.5 / treated as invalid and "Zastosuj" disabled. Test: Task 4 `parseAmountInput`.
5. Deleting the last ingredient, then saving → server rejects as today (`items` error shown), nothing crashes. Test: Task 6 manual check.

---

### Task 1: `plan_meal_eaten` table and repository

**Files:**
- Modify: `src/lib/server/db/schema.ts` (new table + relation next to `planMealExclusions`)
- Create: `drizzle/0001_*.sql` (generated)
- Modify: `src/lib/plan.ts` (`PlanMeal.eatenUserKeys`)
- Modify: `src/lib/server/repositories/plan.ts` (query `eaten: true`, map, `toggleEaten`, `toggleExclusion` clears eaten)

**Interfaces:**
- Produces: table `planMealEaten` (`plan_meal_eaten`: `plan_meal_id` int FK → `plan_meals.id` on delete cascade, `user_key` varchar(32), PK both); `PlanMeal.eatenUserKeys: string[]`; `toggleEaten(planMealId: number, userKey: string): Promise<void>` throwing `PlanNotFoundError` like `toggleExclusion`, and `Error('Cannot mark an excluded user as eaten')` when the user is excluded.

- [ ] **Step 1:** Add `planMealEaten` to the schema (copy the shape of `planMealExclusions`) and a `eaten: many(planMealEaten)` relation on plan meals with the inverse relation.
- [ ] **Step 2:** Run `pnpm db:generate`. Expected: one new SQL file creating `plan_meal_eaten` with the FK and PK; nothing else changed. Review it.
- [ ] **Step 3:** Add `eatenUserKeys: string[]` to `PlanMeal` (doc comment: subset of the users who eat it). In the repository add `eaten: true` to `queryPlanMeals`, map `eatenUserKeys`, implement `toggleEaten` (lock plan meal, refuse when an exclusion exists for the user, else insert/delete), and in `toggleExclusion` delete the user's eaten row in the same transaction when adding an exclusion. `replacePlanMeal` keeps eaten marks (like exclusions).
- [ ] **Step 4:** Fix every place that builds a `PlanMeal` literal in tests (`pnpm check` lists them) by adding `eatenUserKeys: []`.
- [ ] **Step 5:** Run `pnpm db:migrate` locally, then `pnpm check && pnpm test`. Expected: 0 errors, all tests pass.
- [ ] **Step 6:** Commit: `feat: store per-person eaten marks for planned meals`.

### Task 2: eaten kcal per person

**Files:**
- Modify: `src/lib/nutrition.ts`
- Test: `src/lib/nutrition.test.ts`

**Interfaces:**
- Consumes: `CalcPlanMeal` gains `eatenUserKeys: string[]`.
- Produces: `dayEatenKcal(meals: CalcPlanMeal[], users: readonly User[]): Record<string, number>`.

- [ ] **Step 1: Write the failing test**

```ts
test('dayEatenKcal sums only meals the user ate, with their multiplier', () => {
	// rice 70 g = 245 kcal base; users a ×1, b ×1.5
	const meals = [
		{ items: [{ ingredient: rice, amount: 70 }], excludedUserKeys: [], eatenUserKeys: ['a', 'b'] },
		{ items: [{ ingredient: rice, amount: 70 }], excludedUserKeys: [], eatenUserKeys: ['a'] },
		{ items: [{ ingredient: rice, amount: 70 }], excludedUserKeys: ['b'], eatenUserKeys: ['b'] }
	];
	expect(dayEatenKcal(meals, users)).toEqual({ a: 490, b: 367.5 });
});
```
(Use the test file's existing ingredient/user fixtures or define `rice` = 350 kcal/100 g and users `a` ×1, `b` ×1.5; the third meal proves an excluded user's stale mark is ignored.)

- [ ] **Step 2:** Run `pnpm exec vitest run --project server src/lib/nutrition.test.ts`. Expected: FAIL, `dayEatenKcal` not exported.
- [ ] **Step 3:** Add `eatenUserKeys` to `CalcPlanMeal` and implement `dayEatenKcal` with `planMealPerUser` (excluded → null → skipped).
- [ ] **Step 4:** Run the test again. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: eaten kcal per person for a day`.

### Task 3: mark eaten on the plan and show it in the summary

**Files:**
- Modify: `src/routes/plan/+page.server.ts` (schema + `toggleEaten` action)
- Modify: `src/lib/components/PlanMealCard.svelte` (check button per included tile)
- Modify: `src/lib/components/NutritionTable.svelte` (optional `eatenKcal`)
- Modify: `src/routes/plan/+page.svelte` (pass `dayEatenKcal`)
- Create: `src/lib/components/icons/CircleIcon.svelte` (empty-state icon; `CheckIcon` exists)
- Modify: `src/lib/i18n/pl.ts`
- Test: `src/lib/components/NutritionTable.svelte.test.ts`

**Interfaces:**
- Consumes: `toggleEaten` (Task 1), `dayEatenKcal` (Task 2).
- Produces: `NutritionTable` prop `eatenKcal?: Record<string, number>`; when given, the kcal cell reads `pl.nutrition.eatenOfPlanned(eaten, planned)`.

- [ ] **Step 1: Write the failing test**

```ts
test('NutritionTable shows eaten of planned kcal when eatenKcal is given', async () => {
	const screen = render(NutritionTable, {
		perUser: { user1: { kcal: 1610, protein: 100, fat: 50, carbs: 190 }, user2: null },
		eatenKcal: { user1: 820, user2: 0 }
	});
	await expect.element(screen.getByText('820 / 1610')).toBeVisible();
});
```
(Match the exact output of `formatKcal`; if it groups thousands, assert that string.)

- [ ] **Step 2:** Run `pnpm exec vitest run --project client src/lib/components/NutritionTable.svelte.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the prop. Strings in `pl.ts`: `nutrition.eatenOfPlanned: (eaten: string, planned: string) => \`${eaten} / ${planned}\``, `plan.markEaten: (name: string) => \`Zjedzone: ${name}\``.
- [ ] **Step 4:** Add the `toggleEaten` action (schema like `toggleExclusion`; map the "excluded" error to `invalid()`). In `PlanMealCard`, put a separate small form with a check button (`CheckIcon` when eaten, `CircleIcon` otherwise, `aria-pressed`, `aria-label={pl.plan.markEaten(user.name)}`, ≥44px) inside each included tile area — not nested inside the exclusion button; restructure the tile into a wrapper with the exclusion button and the eaten form side by side. Excluded tiles get no eaten button. Pass `eatenKcal={dayEatenKcal(dayMeals, users)}` to the summary table.
- [ ] **Step 5:** Run all checks. Manually: mark Ewelina eaten on breakfast → summary shows `387 / …`; exclude her → mark and eaten kcal disappear.
- [ ] **Step 6:** Commit: `feat: mark planned meals as eaten per person`.

### Task 4: item edit helpers

**Files:**
- Create: `src/lib/item-edit.ts`
- Test: `src/lib/item-edit.test.ts`

**Interfaces:**
- Produces:
  - `parseAmountInput(text: string): number | null` — `null` unless a positive number (`/^\d+([.,]\d+)?$/`, comma allowed).
  - `initialReplacementAmount(oldUnit: Unit, newUnit: Unit, oldAmount: number): number | null` — old amount when units match, else `null`.
  - `matchKcalAmount(oldKcal: number, ingredient: IngredientValues): number | null` — amount giving `oldKcal`, rounded to an integer for g/ml and 1 decimal for pcs; `null` when `oldKcal <= 0` or `ingredient.kcal <= 0`.

- [ ] **Step 1: Write the failing tests**

```ts
test('parseAmountInput', () => {
	expect(parseAmountInput('1,5')).toBe(1.5);
	expect(parseAmountInput('120')).toBe(120);
	expect(parseAmountInput('1,')).toBeNull();
	expect(parseAmountInput('0')).toBeNull();
	expect(parseAmountInput('abc')).toBeNull();
});

test('initialReplacementAmount keeps the amount only for the same unit', () => {
	expect(initialReplacementAmount('g', 'g', 50)).toBe(50);
	expect(initialReplacementAmount('g', 'pcs', 50)).toBeNull();
});

test('matchKcalAmount', () => {
	const oats = { unit: 'g', kcal: 366, protein: 12, fat: 7, carbs: 69 } as const;
	const egg = { unit: 'pcs', kcal: 78, protein: 7, fat: 5, carbs: 0 } as const;
	expect(matchKcalAmount(183, oats)).toBe(50); // 183 / 366 × 100
	expect(matchKcalAmount(100, egg)).toBe(1.3); // 1.28 → 1.3
	expect(matchKcalAmount(100, { ...oats, kcal: 0 })).toBeNull();
	expect(matchKcalAmount(0, oats)).toBeNull();
});
```

- [ ] **Step 2:** Run `pnpm exec vitest run --project server src/lib/item-edit.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3:** Implement the three functions (use `itemNutrition` from `nutrition.ts` for the per-unit kcal).
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: helpers for editing a planned meal ingredient`.

### Task 5: `ItemEditDialog`

**Files:**
- Create: `src/lib/components/ItemEditDialog.svelte`
- Modify: `src/lib/i18n/pl.ts` (`planEdit.*` keys below)
- Test: `src/lib/components/ItemEditDialog.svelte.test.ts`

**Interfaces:**
- Consumes: Task 4 helpers; `Dialog`, `IngredientPicker` (`onPick(ingredient)`), `NumberField`, `Button`; `itemNutrition`, `formatKcal`, `formatMacro`.
- Produces: props `{ open: boolean (bindable); item: MealItem | null /* null = new item: no "Było" row */; initialIngredient?: Ingredient /* for a new item */; onApply: (item: MealItem) => void }`.
- Strings: `planEdit.editItem: 'Edytuj składnik'`, `planEdit.replace: 'Zamień składnik'`, `planEdit.before: 'Było'`, `planEdit.after: 'Będzie'`, `planEdit.matchKcal: 'Dopasuj kcal'`, `planEdit.apply: 'Zastosuj'`, `planEdit.cancel: 'Anuluj'`.

- [ ] **Step 1: Write the failing tests** (browser project, `vitest-browser-svelte`)

```ts
test('replacing shows before and after, and match kcal fills the amount', async () => {
	// item: oats 50 g (183 kcal); pick rice (350 kcal/100 g) via a stubbed picker
	// expect rows "Było" 183 and "Będzie" 175 (50 g rice); click "Dopasuj kcal"
	// → amount field value "52" and "Będzie" shows 182
});

test('apply is disabled while the amount is invalid', async () => {
	// type "1," → "Zastosuj" disabled; type "60" → enabled; click → onApply({ ingredient, amount: 60 })
});
```
Stub the picker's network call the way existing `*.svelte.test.ts` files do, or render the dialog with a test-only way to inject the picked ingredient (e.g. expose picking through `IngredientPicker`'s `onPick` by mocking `fetch` for `/api/ingredients`).

- [ ] **Step 2:** Run `pnpm exec vitest run --project client src/lib/components/ItemEditDialog.svelte.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement: local state `ingredient` (current or picked), `amountText`; comparison table appears once a replacement is picked (and always shows "Będzie" for a new item); "Dopasuj kcal" disabled when `matchKcalAmount` is `null`; "Zastosuj" disabled when `parseAmountInput` is `null`; reset state each time `open` turns true.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: ingredient edit dialog with nutrition comparison`.

### Task 6: list UI on the plan edit page

**Files:**
- Modify: `src/lib/components/MealForm.svelte` (`planMeal` mode only)
- Create: `src/lib/components/icons/TrashIcon.svelte`
- Modify: `src/lib/i18n/pl.ts` (`planEdit.editItemLabel: (name) => \`Edytuj ${name}\``; reuse `meals.removeItem` for delete)

**Interfaces:**
- Consumes: `ItemEditDialog` (Task 5).

- [ ] **Step 1:** In `planMeal` mode render each row as name, `formatAmount` + unit, ✎ button (opens the dialog with that row) and 🗑 button (removes the row, no confirmation). Adding from `IngredientPicker` opens the dialog as a new item instead of appending an empty row; `onApply` updates or appends the row. `meal` mode keeps today's inline rows. `itemsJson` and the live summary keep working from `rows`.
- [ ] **Step 2:** Run all checks.
- [ ] **Step 3:** Manual check in the browser: edit amount, replace oats → rice, "Dopasuj kcal", apply, delete a row, add a new ingredient, "Zapisz" → plan shows the new values; delete all rows and save → items error shown.
- [ ] **Step 4:** Commit: `feat: list with edit and delete for planned meal ingredients`.
