// Imports the ingredients and meals from the dietitian's meal plans (scripts/data/diet-import.json,
// built from the PDFs; reviewed in docs/import/*.md) into the database in DATABASE_URL. It does not
// touch the week plan or the shopping list.
//
// Safe to run more than once: an ingredient is matched to a visible one with the same name (the name
// collation makes it case-insensitive) and inserted only if there is none; a meal whose name already
// exists is skipped. Everything runs in one transaction, so a failure leaves the database unchanged.
//
// Usage: node --env-file=<path to .env> scripts/import-diet.js [--dry-run]
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';

const dryRun = process.argv.includes('--dry-run');
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const data = JSON.parse(
	await readFile(new URL('./data/diet-import.json', import.meta.url), 'utf8')
);

const connection = await mysql.createConnection({ uri: url });
try {
	await connection.beginTransaction();

	/** @type {Map<string, number>} ingredient name (lower case) → id */
	const ingredientIds = new Map();
	let ingredientsAdded = 0;
	for (const ingredient of data.ingredients) {
		const [rows] = await connection.query(
			'SELECT id FROM ingredients WHERE name = ? AND hidden_at IS NULL ORDER BY id LIMIT 1',
			[ingredient.name]
		);
		let id = rows[0]?.id;
		if (id === undefined) {
			const [result] = await connection.query(
				'INSERT INTO ingredients (name, unit, category, kcal, protein, fat, carbs) VALUES (?, ?, ?, ?, ?, ?, ?)',
				[
					ingredient.name,
					ingredient.unit,
					ingredient.category,
					ingredient.kcal,
					ingredient.protein,
					ingredient.fat,
					ingredient.carbs
				]
			);
			id = result.insertId;
			ingredientsAdded++;
		}
		ingredientIds.set(ingredient.name.toLowerCase(), id);
	}

	let mealsAdded = 0;
	const mealsSkipped = [];
	for (const meal of data.meals) {
		const [rows] = await connection.query('SELECT id FROM meals WHERE name = ?', [meal.name]);
		if (rows.length > 0) {
			mealsSkipped.push(meal.name);
			continue;
		}
		const [result] = await connection.query('INSERT INTO meals (name, preparation) VALUES (?, ?)', [
			meal.name,
			meal.preparation
		]);
		const mealId = result.insertId;
		await connection.query('INSERT INTO meal_types (meal_id, type) VALUES (?, ?)', [
			mealId,
			meal.type
		]);
		const items = meal.ingredients.map((item, position) => {
			const ingredientId = ingredientIds.get(item.name.toLowerCase());
			if (ingredientId === undefined) throw new Error(`Unknown ingredient: ${item.name}`);
			return [mealId, ingredientId, item.amount, position];
		});
		await connection.query(
			'INSERT INTO meal_ingredients (meal_id, ingredient_id, amount, position) VALUES ?',
			[items]
		);
		mealsAdded++;
	}

	if (dryRun) await connection.rollback();
	else await connection.commit();

	console.log(
		`${dryRun ? '[dry run, rolled back] ' : ''}ingredients: ${ingredientsAdded} added, ` +
			`${data.ingredients.length - ingredientsAdded} already present; meals: ${mealsAdded} added, ` +
			`${mealsSkipped.length} already present`
	);
	for (const name of mealsSkipped) console.log(`  skipped meal: ${name}`);
} catch (error) {
	await connection.rollback();
	throw error;
} finally {
	await connection.end();
}
