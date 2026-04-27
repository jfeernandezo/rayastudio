import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import { db } from "./db";

export async function runMigrations() {
  const existing = await db.execute(sql`
    select to_regclass('public.projects') as projects,
           to_regclass('public.content_pieces') as content_pieces
  `);
  const row = existing.rows?.[0] as { projects?: string | null; content_pieces?: string | null } | undefined;

  if (!row?.projects && !row?.content_pieces) {
    await migrate(db, { migrationsFolder: "migrations" });
    return;
  }

  await db.execute(sql`
    alter table content_pieces add column if not exists briefing text;
    alter table content_pieces add column if not exists production_package jsonb default 'null'::jsonb;
    alter table content_pieces add column if not exists visual_direction text;
    alter table content_pieces add column if not exists review_checklist text[] default '{}';
  `);
}
