import { getDb } from "@/lib/db";

/**
 * Copies the template automation rules (organization_id IS NULL) to an
 * organization. Idempotent: rules the organization already has are skipped.
 */
export async function seedOrgAutomations(organizationId: string): Promise<void> {
  const db = await getDb();
  await db.query(
    `INSERT INTO "automations" ("organization_id", "n", "on", "trig", "cond", "act", "to")
     SELECT $1, "n", "on", "trig", "cond", "act", "to"
     FROM "automations"
     WHERE "organization_id" IS NULL
     ON CONFLICT DO NOTHING`,
    [organizationId]
  );
}
