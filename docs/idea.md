# Diet app

## Overview

A simple web app for two people to plan meals for the week, keep a database of meals and ingredients,
and build a shopping list from the plan. The whole UI is in Polish.

## Users

- Two users, defined in code (no settings page). Each user has a name and a **multiplier**.
- Code must make it easy to change the number of users, their names and multipliers later.
- A meal recipe is a base portion for an average person. A user's portion, kcal and macros are the
  recipe values multiplied by that user's multiplier.
- All calculations always use the current multiplier (past days are not frozen).

## Nutrition

- Tracked values: **kcal, protein, fat, carbs**.

## Ingredients database

- Page listing all ingredients with a text search.
- User can add and edit an ingredient:
  - **name**
  - **unit**: exactly one per ingredient: grams, milliliters or pieces
  - **kcal, protein, fat, carbs** per 100 g, per 100 ml or per 1 piece (depending on unit)
  - **category**: one of a hardcoded list (vegetables, dairy, fish, meat, …), easy to extend in code
- Editing an ingredient's values recalculates every meal and every planned day that uses it.
- Deleting an ingredient **hides** it: it disappears from search and pickers, but meals that already
  use it keep it and their values stay correct. (Deleting is expected to be rare.)

## Meals database

- Page listing all meals with:
  - a search bar (by name)
  - type filter buttons: breakfast, second breakfast, lunch, dinner, snack
- Meal types are **only a filter**. A meal can have **several types** (e.g. lunch and dinner).
- Create meal page:
  - **photo** (optional)
  - **name** (unique)
  - **types** (one or more)
  - **ingredients** picked from the ingredients database, each with an amount. The ingredient's unit
    is shown next to the amount field (e.g. "Eggs [ 2 ] pcs") so the user knows what number to enter.
  - **preparation**: free text notes
- kcal and macros of a meal are calculated from its ingredients.
- Deleting a meal from the database is allowed. Meals already placed in the plan keep their own copy.

## Meal plan

### Week navigation

- Week bar showing all days of the week (Monday to Sunday), each with its day of the month.
- Today is selected by default.
- Calendar-style arrows to move to the previous/next week, plus a "Today" button.
- Planning is expected about one week ahead; no hard limit forward.
- History is short: plan data older than **4 weeks** is removed automatically.

### Day view

- Shows the meals of the selected day. A day can contain any number of meals.
- Meals are in the order they were added; the user can reorder them (drag).
- At the top of the day: **daily sums per user** (kcal, protein, fat, carbs). No goals or targets.
- An empty day (or a whole unplanned week) shows a clear **"Add meal"** option.

### Meals in the plan

- Each meal shows kcal and macros **for each user** separately.
- A meal is eaten by **all users by default**; any user can be **excluded** from a single meal.
  Excluded users are not counted in that meal's values, the daily sums, or the shopping list.
- **Add** and **replace** use a meal picker: a list loaded on scroll, with the same search bar and
  type filters as the meals database (e.g. show only dinner ideas).
- **Edit** changes only this day's copy of the meal (e.g. swap rice for potatoes on Tuesday). The
  meal in the database and other days are not affected.
  - Optional **"Save as new recipe"** stores the edited copy as a new meal in the database.
- **Remove** removes the meal from that day, after the user confirms.
- There are no per-user, per-day portion overrides (the multiplier always decides).

## Shopping list

There is only one shopping list.

### Creating from the plan

- "Create from meal plan" shows the days from today to the last planned day.
- The user can unselect whole days or single meals before creating.
- Ingredients are summed for all users (respecting multipliers and excluded users). Same ingredient
  is merged into one position.
- If the current list contains any items **not marked as done**, the app asks whether to **merge**
  the new items into it or **replace** it.
  - Merge: amounts of the same ingredient are added together; manual and done items stay.
  - Replace: the old list is cleared and a new one is built.
- If the list is empty or all its items are done, the new list is built directly (old done items are cleared).
- Changing the plan later does **not** update the list automatically.

### Editing the list

- The user can change the amount of any item (just the number, unit comes from the ingredient,
  e.g. 2 pcs → 1 pc).
- The user can quickly add an item: name required, amount and unit optional. While typing the name,
  matching ingredients from the ingredients database are suggested.
  - Picking a suggestion adds that ingredient: it goes to the ingredient's category group and uses its
    unit. If the same ingredient is already on the list and not done, the amount is added to it.
  - Typing a name that isn't picked adds a manual item (group "Other"). Manual items are never merged
    with items built from the plan.
- The user can mark an item as **done**: it moves to a "Done" section below, from where it can be
  marked **undone** and moved back.

### Ordering

- Items are grouped by ingredient category; manual items go to an **"Other"** group.
- Items are sorted alphabetically within each group.

### Refresh

- While on the shopping list page, the list refreshes every 5 seconds, but only on mobile devices
  with the screen unlocked (page visible).
