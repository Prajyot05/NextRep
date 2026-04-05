import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import path from 'path';

const expectedTables = [
  'users',
  'refresh_tokens',
  'exercises',
  'workout_templates',
  'template_exercises',
  'workout_sessions',
  'workout_sets',
  'personal_records',
  'body_measurements',
  'streak_history',
  'user_streaks',
  'milestones',
];

const expectedTypes = [
  'exercise_category',
  'muscle_group',
  'set_type',
  'pr_type',
  'milestone_type',
];

async function schemaAlreadyExists(sql: any) {
  for (const tableName of expectedTables) {
    const rows = (await sql`SELECT to_regclass(${`public.${tableName}`}) IS NOT NULL AS exists`) as Array<{ exists: boolean }>;
    if (!rows[0]?.exists) return false;
  }

  for (const typeName of expectedTypes) {
    const rows = (await sql`SELECT to_regtype(${`public.${typeName}`}) IS NOT NULL AS exists`) as Array<{ exists: boolean }>;
    if (!rows[0]?.exists) return false;
  }

  return true;
}

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  const sql = neon(process.env.DATABASE_URL);
  if (await schemaAlreadyExists(sql)) {
    console.log('Schema already exists; skipping migrations.');
    process.exit(0);
  }

  const db  = drizzle(sql);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
  console.log('Migrations complete.');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
