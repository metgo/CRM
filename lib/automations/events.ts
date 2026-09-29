import { getBoss, QUEUES } from "./boss";

export type RecordEventKind = "created" | "updated" | "deleted";

export type RecordEvent = {
  kind: RecordEventKind;
  coll: string;
  id: string;
  organizationId: string;
  userId: string;
  /** Row before the change (null on create). */
  before: Record<string, unknown> | null;
  /** Row after the change (null on delete). */
  after: Record<string, unknown> | null;
  /** Property names whose value differs between before and after. */
  changed: string[];
  at: string;
};

// Collections whose writes never trigger automations.
const IGNORED = new Set(["settings", "automations"]);

const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function changedKeys(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): string[] {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  keys.delete("updatedAt");
  return [...keys].filter((k) => !same(before?.[k], after?.[k]));
}

/**
 * Queues a record event for the automation worker. The write that caused it
 * has already been saved, so a failure here is logged and never surfaced to
 * the user; the daily sweep catches anything an event missed.
 */
export async function publishRecordEvent(
  e: Omit<RecordEvent, "changed" | "at">
): Promise<void> {
  if (IGNORED.has(e.coll)) return;
  const changed = changedKeys(e.before, e.after);
  if (e.kind === "updated" && !changed.length) return;

  try {
    const boss = await getBoss();
    const event: RecordEvent = { ...e, changed, at: new Date().toISOString() };
    await boss.send(QUEUES.recordEvent, event);
  } catch (err) {
    console.error(`[automations] failed to queue ${e.coll}.${e.kind} ${e.id}`, err);
  }
}
