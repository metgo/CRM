import { getDb } from "@/lib/db";

export type ActionRef = {
  organizationId: string;
  rule: number;
  coll: string;
  recordId: string;
  channel: string;
  dedupeKey: string;
};

/**
 * Reserves an action in automation_log before it is performed. Returns false
 * when the same dedupe key was already logged, i.e. the action already
 * happened (or is happening in another worker) and must be skipped.
 */
export async function claimAction(a: ActionRef): Promise<boolean> {
  const db = await getDb();
  const rows: unknown[] = await db.query(
    `INSERT INTO "automation_log"
       ("organization_id", "rule", "coll", "record_id", "channel", "dedupe_key", "status")
     VALUES ($1, $2, $3, $4, $5, $6, 'sent')
     ON CONFLICT ("organization_id", "dedupe_key") DO NOTHING
     RETURNING "id"`,
    [a.organizationId, a.rule, a.coll, a.recordId, a.channel, a.dedupeKey]
  );
  return rows.length > 0;
}

/** Records the outcome and details of a claimed action. */
export async function finishAction(
  a: Pick<ActionRef, "organizationId" | "dedupeKey">,
  status: "sent" | "skipped",
  detail: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  await db.query(
    `UPDATE "automation_log" SET "status" = $3, "detail" = $4
     WHERE "organization_id" = $1 AND "dedupe_key" = $2`,
    [a.organizationId, a.dedupeKey, status, JSON.stringify(detail)]
  );
}

/** Drops a claim whose action failed, so a retry can claim it again. */
export async function releaseAction(a: Pick<ActionRef, "organizationId" | "dedupeKey">): Promise<void> {
  const db = await getDb();
  await db.query(
    `DELETE FROM "automation_log" WHERE "organization_id" = $1 AND "dedupe_key" = $2`,
    [a.organizationId, a.dedupeKey]
  );
}

/** Claims, performs and records an action; a thrown error releases the claim. */
export async function runOnce(
  a: ActionRef,
  perform: () => Promise<{ status: "sent" | "skipped"; detail: Record<string, unknown> }>
): Promise<boolean> {
  if (!(await claimAction(a))) return false;
  try {
    const { status, detail } = await perform();
    await finishAction(a, status, detail);
    return status === "sent";
  } catch (err) {
    await releaseAction(a);
    throw err;
  }
}
