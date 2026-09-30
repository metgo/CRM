import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the columns/tables needed for password reset, email verification,
 * session revocation and auth audit logging, and promotes the org-creating
 * "admin" role to "superadmin" (the role now required to reach Settings).
 */
export class AddAuthSecurity1789300000000 implements MigrationInterface {
  name = "AddAuthSecurity1789300000000";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE "profiles"
        ADD COLUMN IF NOT EXISTS "email_verified"       boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "last_login_at"         timestamptz,
        ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "token_version"         integer NOT NULL DEFAULT 0
    `);

    // "admin" becomes "superadmin" — the role gate now used for Settings.
    await q.query(`UPDATE "profiles" SET "role" = 'superadmin' WHERE "role" = 'admin'`);

    await q.query(`
      CREATE TABLE IF NOT EXISTS "auth_tokens" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "profile_id" uuid NOT NULL,
        "purpose"    text NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "used_at"    timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_auth_tokens_profile" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE
      )
    `);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_auth_tokens_token_hash" ON "auth_tokens" ("token_hash")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_auth_tokens_profile" ON "auth_tokens" ("profile_id")`);

    await q.query(`
      CREATE TABLE IF NOT EXISTS "auth_events" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "profile_id"      uuid,
        "event_type"      text NOT NULL,
        "ip"              text,
        "user_agent"      text,
        "metadata"        jsonb,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_auth_events_profile" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL
      )
    `);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_auth_events_profile" ON "auth_events" ("profile_id")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_auth_events_created" ON "auth_events" ("created_at" DESC)`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "auth_events"`);
    await q.query(`DROP TABLE IF EXISTS "auth_tokens"`);
    await q.query(`UPDATE "profiles" SET "role" = 'admin' WHERE "role" = 'superadmin'`);
    await q.query(`
      ALTER TABLE "profiles"
        DROP COLUMN IF EXISTS "email_verified",
        DROP COLUMN IF EXISTS "last_login_at",
        DROP COLUMN IF EXISTS "failed_login_attempts",
        DROP COLUMN IF EXISTS "token_version"
    `);
  }
}
