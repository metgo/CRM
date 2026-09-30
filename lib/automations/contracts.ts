import { getDb, Client, Contract, Payment, Task } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import type { RecordEvent } from "./events";
import { runOnce } from "./log";
import { clientInfo, isRuleOn, managers, profile, type Person } from "./lookup";
import { contractSignedEmail, type ContractSignedSummary } from "./emails";
import { schedulePaymentJobs } from "./payments";
import { scheduleTaskJobs } from "./tasks";
import { addDaysIso, todayIso } from "./time";

/**
 * Contract signed — automation rule 17.
 *
 * When a contract's status becomes "signed", once per contract:
 *   1. the client is set to active (and "activated on" to today, if empty)
 *   2. payment rows are created from the contract's payment schedule, or one
 *      row for the contract amount when there is no schedule; skipped when the
 *      contract already has payments
 *   3. onboarding tasks are opened for the owner, only when this signature is
 *      what activated the client (a renewal or addendum for an existing
 *      active client gets none)
 * The new payments and tasks get their reminders scheduled (rules 1–4, 19),
 * and the owner gets one summary email.
 */

/** Onboarding checklist opened on signature. `inDays` counts from today. */
const ONBOARDING: { he: string; en: string; domain: string; priority: string; inDays: number }[] = [
  { he: "לוודא איש קשר לחיוב ופרטי חשבונית", en: "Confirm billing contact and invoice details", domain: "collection", priority: "high", inDays: 2 },
  { he: "פגישת התנעה עם הלקוח", en: "Kickoff meeting with the client", domain: "ops", priority: "high", inDays: 5 },
  { he: "הקמת הפרויקט במערכת", en: "Set up the project in the system", domain: "ops", priority: "med", inDays: 7 },
];

type ScheduleRow = { m?: string; date?: string; amt?: number | string };

/** Subscriber for contract record events. */
export async function onContractEvent(e: RecordEvent): Promise<void> {
  const c = e.after;
  if (!c || c.status !== "signed") return;
  if (e.kind !== "created" && !e.changed.includes("status")) return;
  if (!(await isRuleOn(e.organizationId, 17))) return;
  await onSigned(e.organizationId, String(c.id));
}

async function onSigned(organizationId: string, contractId: string) {
  const db = await getDb();
  const contract = await db.getRepository(Contract).findOne({ where: { id: contractId, organizationId } });
  if (!contract || contract.status !== "signed" || !contract.client) return;

  const client = await clientInfo(organizationId, contract.client);
  if (!client) return;
  const mgrs = await managers(organizationId);
  const ownerId = contract.owner ?? client.owner ?? mgrs[0]?.id ?? null;
  const today = todayIso();

  await runOnce(
    {
      organizationId, rule: 17, coll: "contracts", recordId: contract.id,
      channel: "status", dedupeKey: `contract:${contract.id}:r17`,
    },
    async () => {
      // All record changes commit together, so a failure leaves nothing half-done
      // and the retry starts clean.
      const done = await db.transaction(async (m) => {
        const clients = m.getRepository(Client);
        const row = await clients.findOne({ where: { id: client.id, organizationId } });
        const clientActivated = Boolean(row && row.status !== "active");
        if (row && clientActivated) {
          await clients.update({ id: row.id }, { status: "active", activated: row.activated ?? today });
        }

        const payRepo = m.getRepository(Payment);
        const existing = await payRepo.count({ where: { contract: contract.id, organizationId } });
        const planned = existing ? [] : paymentRows(contract, today);
        const payments = planned.length ? await payRepo.save(planned.map((p) => payRepo.create({
          organizationId, client: contract.client, contract: contract.id, status: "planned", ...p,
        }))) : [];
        const paymentsSkipped = existing
          ? `the contract already has ${existing} payment(s)`
          : planned.length ? null : "no payment schedule and no contract amount";

        const taskRepo = m.getRepository(Task);
        const tasks = !clientActivated ? [] : await taskRepo.save(ONBOARDING.map((t) => taskRepo.create({
          organizationId,
          titleHe: `${t.he} — ${client.name}`,
          titleEn: `${t.en} — ${client.name}`,
          domain: t.domain,
          client: contract.client,
          deal: contract.deal,
          assignee: ownerId,
          priority: t.priority,
          due: addDaysIso(today, t.inDays),
          status: "todo",
          src: "automation",
        })));

        return { clientActivated, payments, paymentsSkipped, tasks };
      });

      // Follow-ups run after the commit and must not throw: a retry would
      // redo the changes above. Failures are recorded in the log detail.
      const errors: string[] = [];
      const attempt = async (what: string, fn: () => Promise<unknown>) => {
        try { await fn(); } catch (err) {
          errors.push(`${what}: ${(err as Error).message}`);
          console.error(`[automations] rule 17 ${what} failed for contract ${contract.id}`, err);
        }
      };

      for (const p of done.payments) {
        await attempt(`schedule payment ${p.id}`, () => schedulePaymentJobs(organizationId, p.id, p.due, p.status));
      }
      for (const t of done.tasks) {
        await attempt(`schedule task ${t.id}`, () => scheduleTaskJobs(organizationId, t.id, t.due, t.status));
      }

      const owner = await profile(organizationId, ownerId);
      const to: Person[] = owner ? [owner] : mgrs;
      if (to.length) {
        const summary: ContractSignedSummary = {
          client: client.name,
          po: contract.po,
          clientActivated: done.clientActivated,
          payments: done.payments.map((p) => ({ label: p.notes || "תשלום", due: p.due, net: p.net })),
          paymentsSkipped: done.paymentsSkipped,
          tasks: done.tasks.map((t) => ({ title: t.titleHe, due: t.due })),
        };
        await attempt("email", () =>
          sendEmail({ to: to[0].email, cc: to.slice(1).map((p) => p.email), ...contractSignedEmail(summary) })
        );
      }

      return {
        status: "sent",
        detail: {
          clientActivated: done.clientActivated,
          paymentIds: done.payments.map((p) => p.id),
          paymentsSkipped: done.paymentsSkipped,
          taskIds: done.tasks.map((t) => t.id),
          notified: to.map((p) => p.email),
          errors,
        },
      };
    }
  );
}

/**
 * Payment rows for a contract: one per schedule row that has a date and an
 * amount; otherwise one row for the contract amount, due on the start date
 * (or the signature date, or today).
 */
function paymentRows(contract: Contract, today: string): Partial<Payment>[] {
  const schedule = (Array.isArray(contract.schedule) ? contract.schedule : []) as ScheduleRow[];
  const rows = schedule
    .filter((r) => r.date && Number(r.amt) > 0)
    .map((r) => ({
      type: "milestone",
      net: String(Number(r.amt)),
      due: String(r.date).slice(0, 10),
      notes: r.m || null,
    }));
  if (rows.length) return rows;

  if (Number(contract.net) > 0) {
    return [{
      type: "once",
      net: String(Number(contract.net)),
      due: (contract.start || contract.signed || today).slice(0, 10),
      notes: null,
    }];
  }
  return [];
}
