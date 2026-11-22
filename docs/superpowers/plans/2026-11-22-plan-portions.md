# Plan Portions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A per-planned-meal portion count stored in the DB that multiplies the plan's nutrition, the cooking view amounts and the shopping list.

**Architecture:** New `plan_meals.portions` column; `PlanMeal.portions`; the multiplier is applied in `planMealPerUser` (all nutrition), `cookingTable` (amounts) and `buildFromPlan` (shopping). A `setPortions` action and a dialog in `PlanMealCard`'s menu set it.

**Tech Stack:** SvelteKit 2, Svelte 5, Drizzle + MySQL 8, valibot, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-22-plan-portions-design.md`

## Global Constraints

- UI strings in `pl.ts`; CSS variables only; touch targets ≥ 44px; never assume two users.
- Schema change via `pnpm db:generate`, SQL reviewed and committed.
- Before each commit: `pnpm lint && pnpm format:check && pnpm check && pnpm test`.

## Review Focus

1. Replacing a meal with portions 2 → portions back to 1 (spec decision). Manual check, Task 3.
2. Portions "1,5" typed → saved as 1.5; "0", "1,", "100", "1,555" → rejected with a message. Test: Task 3 schema test.
3. A meal everyone skips with portions 3 → still adds nothing to shopping. Test: Task 2.
4. Eaten kcal for a 2-portion meal → doubled (eaten / planned stay consistent). Test: Task 2.
5. Badge pluralisation: 1,5 / 2 / 5 portions read correctly in Polish. Test: Task 3 (`pl.plan.portions`).

---

### Task 1: column and repository

**Files:** `src/lib/server/db/schema.ts`, `drizzle/0002_*.sql`, `src/lib/plan.ts`, `src/lib/server/repositories/plan.ts`

**Interfaces — Produces:** `planMeals.portions` (`decimal('portions', { precision: 5, scale: 2 }).notNull().default('1')`); `PlanMeal.portions: number`; `setPlanMealPortions(planMealId: number, portions: number): Promise<void>` (throws `PlanNotFoundError` when missing); `replacePlanMeal` sets `portions: '1'`.

- [ ] Add the column, generate and review the migration, migrate locally.
- [ ] Map `portions` with `toNum`; implement `setPlanMealPortions` (lock, update); reset in `replacePlanMeal`.
- [ ] `pnpm check && pnpm test` green; commit `feat: store a portion count per planned meal`.

### Task 2: apply portions in calculations

**Files:** `src/lib/nutrition.ts`, `src/lib/cooking.ts`, `src/lib/shopping.ts` + their tests

**Interfaces:** `CalcPlanMeal` gains `portions?: number` (missing = 1); `cookingTable` and `buildFromPlan` read `meal.portions ?? 1`.

- [ ] Failing tests: `planMealPerUser` with `portions: 2` doubles kcal; `dayEatenKcal` doubles for an eaten 2-portion meal; `cookingTable` with `portions: 2` doubles amounts and per-portion kcal row shows the meal's kcal ×2 per person (it is what each person eats); `buildFromPlan` doubles a 2-portion meal and still skips an all-excluded 3-portion meal.
- [ ] Implement; tests green; commit `feat: portion count multiplies plan nutrition, cooking and shopping`.

### Task 3: set portions from the card menu

**Files:** `src/routes/plan/+page.server.ts`, `src/lib/components/PlanMealCard.svelte`, `src/lib/i18n/pl.ts`, `src/lib/schemas/plan.ts` (new) + `src/lib/schemas/plan.test.ts`

**Interfaces — Produces:** `portionsInput` valibot schema (string → number, comma allowed, > 0, ≤ 99, ≤ 2 decimals) in `src/lib/schemas/plan.ts`; strings `plan.portionsMenu: 'Ilość porcji'`, `plan.portionsTitle`, `plan.portionsLabel`, `plan.portionsSave`, `plan.portionsInvalid`, `plan.portions(n: number): string` ("1,5 porcji", "2 porcje", "5 porcji").

- [ ] Failing tests for `portionsInput` (accepts "2", "1,5"; rejects "0", "1,", "100", "1,555") and `pl.plan.portions`.
- [ ] Implement schema and strings; `setPortions` action (returns `fail(400, { error: pl.plan.portionsInvalid })` on bad input); menu item + `Dialog` with `NumberField` and submit; badge in the card subtitle when `portions !== 1`.
- [ ] Manual browser check: set 2 → tiles and summary double, badge shows; cooking view doubles; replace meal → back to 1; shopping list from plan doubles that meal.
- [ ] Commit `feat: set the portion count of a planned meal`.
