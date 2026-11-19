import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

// `vite build` imports server modules to analyse routes; env vars are not set then.
if (!env.DATABASE_URL && !building) throw new Error('DATABASE_URL is not set');

// The pool connects lazily, on the first query.
const client = mysql.createPool(env.DATABASE_URL ? { uri: env.DATABASE_URL } : {});

export const db = drizzle(client, { schema, mode: 'default' });
