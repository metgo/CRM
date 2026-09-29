import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Scopes automation rules per organization and adds the automation log.
 *
 * - `automations` gains `organization_id`. The 24 rows seeded by AddMetgoCrm
 *   keep `organization_id IS NULL` and become the template; every existing
 *   organization gets its own copy (carrying the template's current on/off
 *   state), and new organizations are seeded at signup (lib/automations/seed.ts).
 * - `automation_log` records every action the automation worker takes, keyed
 *   by a per-org `dedupe_key` so the same reminder is never sent twice.
 */
export class AutomationsPerOrgAndLog1789600000000 implements MigrationInterface {
  name = "AutomationsPerOrgAndLog1789600000000";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE "automations"
        ADD COLUMN IF NOT EXISTS "organization_id" uuid
        REFERENCES "organizations"("id") ON DELETE CASCADE
    `);
    await q.query(`ALTER TABLE "automations" DROP CONSTRAINT IF EXISTS "automations_n_key"`);
    await q.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_automations_template_n"
        ON "automations" ("n") WHERE "organization_id" IS NULL
    `);
    await q.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_automations_org_n"
        ON "automations" ("organization_id", "n") WHERE "organization_id" IS NOT NULL
    `);
    await q.query(`
      INSERT INTO "automations" ("organization_id", "n", "on", "trig", "cond", "act", "to")
      SELECT o."id", a."n", a."on", a."trig", a."cond", a."act", a."to"
      FROM "organizations" o
      CROSS JOIN "automations" a
      WHERE a."organization_id" IS NULL
      ON CONFLICT DO NOTHING
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS "automation_log" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "rule"            integer NOT NULL,
        "coll"            text NOT NULL,
        "record_id"       uuid NOT NULL,
        "channel"         text NOT NULL,
        "dedupe_key"      text NOT NULL,
        "status"          text NOT NULL DEFAULT 'sent',
        "detail"          jsonb,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_automation_log_dedupe" UNIQUE ("organization_id", "dedupe_key")
      )
    `);
    await q.query(`
      CREATE INDEX IF NOT EXISTS "IDX_automation_log_record"
        ON "automation_log" ("coll", "record_id")
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "automation_log"`);

    await q.query(`DELETE FROM "automations" WHERE "organization_id" IS NOT NULL`);
    await q.query(`DROP INDEX IF EXISTS "UQ_automations_org_n"`);
    await q.query(`DROP INDEX IF EXISTS "UQ_automations_template_n"`);
    await q.query(`ALTER TABLE "automations" DROP COLUMN IF EXISTS "organization_id"`);
    await q.query(`ALTER TABLE "automations" ADD CONSTRAINT "automations_n_key" UNIQUE ("n")`);
  }
}
