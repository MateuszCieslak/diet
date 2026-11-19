import { relations, sql } from 'drizzle-orm';
import {
	date,
	datetime,
	decimal,
	index,
	int,
	mysqlTable,
	primaryKey,
	text,
	uniqueIndex,
	varchar
} from 'drizzle-orm/mysql-core';

// Config keys (units, categories, meal types, user keys) are stored as varchar, never ENUM.
// DECIMAL columns come back as strings; convert them with `toNum` in repositories.

const createdAt = () =>
	datetime('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`);

const updatedAt = () =>
	datetime('updated_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
		.$onUpdate(() => new Date());

export const ingredients = mysqlTable('ingredients', {
	id: int('id').autoincrement().primaryKey(),
	name: varchar('name', { length: 120 }).notNull(),
	unit: varchar('unit', { length: 8 }).notNull(),
	category: varchar('category', { length: 32 }).notNull(),
	kcal: decimal('kcal', { precision: 7, scale: 2 }).notNull(),
	protein: decimal('protein', { precision: 7, scale: 2 }).notNull(),
	fat: decimal('fat', { precision: 7, scale: 2 }).notNull(),
	carbs: decimal('carbs', { precision: 7, scale: 2 }).notNull(),
	hiddenAt: datetime('hidden_at'),
	createdAt: createdAt(),
	updatedAt: updatedAt()
});

export const meals = mysqlTable(
	'meals',
	{
		id: int('id').autoincrement().primaryKey(),
		name: varchar('name', { length: 120 }).notNull(),
		photoPath: varchar('photo_path', { length: 64 }),
		preparation: text('preparation'),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(t) => [uniqueIndex('meals_name_unique').on(t.name)]
);

/** SQL table `meal_types`; named so it does not clash with the `mealTypes` config constant. */
export const mealTypeLinks = mysqlTable(
	'meal_types',
	{
		mealId: int('meal_id')
			.notNull()
			.references(() => meals.id, { onDelete: 'cascade' }),
		type: varchar('type', { length: 32 }).notNull()
	},
	(t) => [primaryKey({ columns: [t.mealId, t.type] })]
);

export const mealIngredients = mysqlTable('meal_ingredients', {
	id: int('id').autoincrement().primaryKey(),
	mealId: int('meal_id')
		.notNull()
		.references(() => meals.id, { onDelete: 'cascade' }),
	ingredientId: int('ingredient_id')
		.notNull()
		.references(() => ingredients.id, { onDelete: 'restrict' }),
	amount: decimal('amount', { precision: 8, scale: 2 }).notNull(),
	position: int('position').notNull()
});

export const planMeals = mysqlTable(
	'plan_meals',
	{
		id: int('id').autoincrement().primaryKey(),
		date: date('date', { mode: 'string' }).notNull(),
		position: int('position').notNull(),
		sourceMealId: int('source_meal_id').references(() => meals.id, { onDelete: 'set null' }),
		name: varchar('name', { length: 120 }).notNull(),
		photoPath: varchar('photo_path', { length: 64 }),
		preparation: text('preparation'),
		createdAt: createdAt()
	},
	(t) => [index('plan_meals_date_position_idx').on(t.date, t.position)]
);

export const planMealIngredients = mysqlTable('plan_meal_ingredients', {
	id: int('id').autoincrement().primaryKey(),
	planMealId: int('plan_meal_id')
		.notNull()
		.references(() => planMeals.id, { onDelete: 'cascade' }),
	ingredientId: int('ingredient_id')
		.notNull()
		.references(() => ingredients.id, { onDelete: 'restrict' }),
	amount: decimal('amount', { precision: 8, scale: 2 }).notNull(),
	position: int('position').notNull()
});

export const planMealExclusions = mysqlTable(
	'plan_meal_exclusions',
	{
		planMealId: int('plan_meal_id')
			.notNull()
			.references(() => planMeals.id, { onDelete: 'cascade' }),
		userKey: varchar('user_key', { length: 32 }).notNull()
	},
	(t) => [primaryKey({ columns: [t.planMealId, t.userKey] })]
);

/** One shared list, so there is no list table. `ingredientId` null means a manual item. */
export const shoppingListItems = mysqlTable('shopping_list_items', {
	id: int('id').autoincrement().primaryKey(),
	ingredientId: int('ingredient_id').references(() => ingredients.id, { onDelete: 'restrict' }),
	name: varchar('name', { length: 120 }),
	unit: varchar('unit', { length: 8 }),
	amount: decimal('amount', { precision: 10, scale: 2 }),
	doneAt: datetime('done_at'),
	createdAt: createdAt()
});

export const mealsRelations = relations(meals, ({ many }) => ({
	types: many(mealTypeLinks),
	ingredients: many(mealIngredients)
}));

export const mealTypeLinksRelations = relations(mealTypeLinks, ({ one }) => ({
	meal: one(meals, { fields: [mealTypeLinks.mealId], references: [meals.id] })
}));

export const mealIngredientsRelations = relations(mealIngredients, ({ one }) => ({
	meal: one(meals, { fields: [mealIngredients.mealId], references: [meals.id] }),
	ingredient: one(ingredients, {
		fields: [mealIngredients.ingredientId],
		references: [ingredients.id]
	})
}));

export const planMealsRelations = relations(planMeals, ({ one, many }) => ({
	sourceMeal: one(meals, { fields: [planMeals.sourceMealId], references: [meals.id] }),
	ingredients: many(planMealIngredients),
	exclusions: many(planMealExclusions)
}));

export const planMealIngredientsRelations = relations(planMealIngredients, ({ one }) => ({
	planMeal: one(planMeals, {
		fields: [planMealIngredients.planMealId],
		references: [planMeals.id]
	}),
	ingredient: one(ingredients, {
		fields: [planMealIngredients.ingredientId],
		references: [ingredients.id]
	})
}));

export const planMealExclusionsRelations = relations(planMealExclusions, ({ one }) => ({
	planMeal: one(planMeals, {
		fields: [planMealExclusions.planMealId],
		references: [planMeals.id]
	})
}));

export const shoppingListItemsRelations = relations(shoppingListItems, ({ one }) => ({
	ingredient: one(ingredients, {
		fields: [shoppingListItems.ingredientId],
		references: [ingredients.id]
	})
}));
