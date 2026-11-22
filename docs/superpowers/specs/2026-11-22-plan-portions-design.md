# Portion count for planned meals — design

**Why:** sometimes a planned meal is eaten in more than one portion (e.g. extra cake). The plan's kcal
and the shopping list must reflect that.

- Each planned meal has `portions` (DECIMAL(5,2), default 1, > 0, at most 2 decimals, at most 99),
  one value for all users, stored in `plan_meals.portions`. One migration.
- **Set from** the ⋯ menu of a meal card: new item "Ilość porcji" opens a dialog with a number field
  (Polish comma allowed) and "Zapisz", posting to a new `/plan` action `setPortions`.
- **Applies to** (all multiply by `portions`):
  - per-person kcal/macros on the card tiles, the day summary and eaten kcal (via
    `planMealPerUser`, which every nutrition total goes through);
  - the cooking view amounts and "Razem" (the device-only "Kalkulator" multiplies on top);
  - the shopping list built from the plan (`buildFromPlan`).
- **Card badge:** when `portions ≠ 1`, the card subtitle shows e.g. "Śniadanie · 2 porcje".
- **Replacing** the meal via ⋯ resets `portions` to 1 (decided). Exclusions stay; eaten marks are
  cleared (existing behaviour).
- The "Edytuj" page is unchanged: ingredient amounts stay per 1 portion.
- Approaches: a single stored multiplier on the plan meal (chosen) vs. scaling the stored ingredient
  amounts (rejected: loses the 1-portion recipe and makes "back to 1" lossy).
