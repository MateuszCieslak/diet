// Applies the SQL migrations in `drizzle/` to the database in DATABASE_URL. Used by the deploy
// (the server has no drizzle-kit); it records applied migrations in the same `__drizzle_migrations`
// table as `pnpm db:migrate`, so both can be used on one database.
//
// Usage: node --env-file=<path to .env> scripts/migrate.js
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const connection = await mysql.createConnection({ uri: url });
try {
	await migrate(drizzle(connection), {
		migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url))
	});
	console.log('migrations: up to date');
} finally {
	await connection.end();
}
