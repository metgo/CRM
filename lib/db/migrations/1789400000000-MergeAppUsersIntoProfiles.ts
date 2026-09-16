import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The "users" (team directory) collection used to be backed by its own
 * `app_users` table, disconnected from `profiles` — so a "team member"
 * referenced as a deal/task owner had no way to ever log in and act on it.
 * `users` is now backed directly by `profiles` (see lib/mc/server/team.ts),
 * so the standalone directory table is no longer needed.
 */
export class MergeAppUsersIntoProfiles1789400000000 implements MigrationInterface {
  name = "MergeAppUsersIntoProfiles1789400000000";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "app_users"`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE IF NOT EXISTS "app_users" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "name_he"         text NOT NULL,
        "name_en"         text,
        "role"            text,
        "email"           text,
        "active"          boolean NOT NULL DEFAULT true,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);
  }
}
