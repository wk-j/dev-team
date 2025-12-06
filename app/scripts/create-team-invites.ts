import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function createTeamInvitesTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "team_invites" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
        "email" varchar(255) NOT NULL,
        "role" varchar(50) NOT NULL DEFAULT 'member',
        "invited_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token" varchar(64) NOT NULL UNIQUE,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "expires_at" timestamp with time zone NOT NULL,
        "accepted_at" timestamp with time zone
      )
    `);
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "team_invites_team_idx" ON "team_invites" ("team_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "team_invites_email_idx" ON "team_invites" ("email")`);
    
    console.log('team_invites table created successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

createTeamInvitesTable();
