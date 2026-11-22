# Eaten meals and plan ingredient editing — design

Two independent changes to the week plan. Built in this order.

## 1. Marking a planned meal as eaten (per person)

**Why:** during the day each person wants to tick off what they have already eaten and see how much
of the day's plan is behind them.

- "Eaten" is **per person per planned meal** (decided). Ewelina can mark lunch eaten while Mati's
  stays open.
- **Data:** new table `plan_meal_eaten (plan_meal_id, user_key)`, primary key on both, cascade on
  plan meal delete. Mirrors `plan_meal_exclusions`. One Drizzle migration. `PlanMeal` gains
  `eatenUserKeys: string[]`.
- **Toggle:** form action `toggleEaten` on `/plan` (same shape as `toggleExclusion`). Marking an
  excluded person as eaten is refused. Excluding a person removes their eaten mark in the same
  transaction, so "eaten" is always a subset of "eats".
- **Card UI:** each included person's tile gets a separate small check button (✓ when eaten, ○ when
  not), `aria-pressed`, label "Zjedzone: <name>". Tapping the rest of the tile still toggles
  exclusion. Excluded tiles have no check button. Rejected alternative: one tile tap cycling
  included → eaten → excluded (easy to overshoot).
- **Day summary:** the kcal cell of each person's row shows `eaten / planned`, e.g. `820 / 1 610`.
  Macros stay the planned totals. `dayTotals` keeps returning planned totals; a new
  `dayEatenKcal(meals, users)` returns eaten kcal per person (eaten meals only, with multiplier).

## 2. Editing ingredients of a planned meal

**Why:** swapping an ingredient today means remove + add with no idea how nutrition changes; the
user wants to see the difference and match kcal in one tap.

- **Approach A (decided):** keep `/plan/[planMealId]/edit` and its single "Zapisz" (plus "Zapisz jako
  przepis"). Changes stay in page state until saved. Rejected: B, saving each popup immediately
  (no way to back out, many new actions).
- Only the plan edit page (`MealForm` mode `planMeal`) changes. The recipe editor keeps today's
  rows.
- **List:** one row per ingredient: name, amount + unit, ✎ (edit) and 🗑 (delete, no confirmation;
  nothing is saved until "Zapisz"). Below: the existing ingredient picker to add an item; a new item
  opens the edit popup so its amount can be entered.
- **Edit popup** (existing `Dialog`): amount field for the current ingredient and a "Zamień
  składnik" search (existing `IngredientPicker`). After picking a replacement:
  - The new amount defaults to the old amount when the unit is the same, otherwise empty.
  - A comparison table: rows "Było" (old ingredient at old amount) and "Będzie" (new ingredient at
    the typed amount), columns kcal, B, T, W. Values are for the standard portion (the amounts the
    page edits), not per person.
  - "Dopasuj kcal" sets the new amount to `oldKcal / newKcalPerUnit`, rounded to a whole number for
    g/ml and to 1 decimal for pcs; disabled when the new ingredient has 0 kcal or the old kcal is 0.
  - "Zastosuj" writes the change into the list; "Anuluj"/close discards it.
- Validation stays server-side as today (amount > 0 etc.); the popup's "Zastosuj" is disabled while
  the amount is not a positive number.

## Left to the builder

Exact styling (tokens from `base.css`), icon for delete (a new trash stroke icon), Polish strings in
`pl.ts`, test split between pure helpers (`*.test.ts`) and component tests (`*.svelte.test.ts`).
