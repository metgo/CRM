import { getRepository, Payment, Task } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { getBoss, QUEUES } from "./boss";
import type { RecordEvent } from "./events";
import { runOnce } from "./log";
import {
  billingContact, clientInfo, debtAfter, isRuleOn, managers, orgName, profile,
  type ClientInfo, type Person,
} from "./lookup";
import {
  debtEscalationEmail, invoiceDueSoonEmail, missingContactEmail, paymentReminderEmail,
  type PaymentFacts,
} from "./emails";
import { addDaysIso, atLocalHour, daysBetweenIso, todayIso } from "./time";

/**
 * Payment reminders — automation rules 1–4.
 *
 *   rule 1  due − 7 days       status planned           internal: issue the invoice
 *   rule 2  due date           invoiced, unpaid         email billing contact, reminders +1
 *   rule 3  due + 7/14/21      still unpaid             email contact (cc owner), reminders +1
 *   rule 4  reminders ≥ debtAfter                       status → debt, urgent task, email managers
 *
 * Saving a payment queues one job per step. Each job re-reads the payment when
 * it runs and does nothing if it was paid, deleted, or its due date moved (the
 * save that moved it queued fresh jobs for the new date).
 */

export type PaymentJob = {
  organizationId: string;
  paymentId: string;
  rule: 1 | 2 | 3;
  offset: number;
  due: string;
};

const STEPS: { rule: PaymentJob["rule"]; offset: number }[] = [
  { rule: 1, offset: -7 },
  { rule: 2, offset: 0 },
  { rule: 3, offset: 7 },
  { rule: 3, offset: 14 },
  { rule: 3, offset: 21 },
];

const UNPAID = new Set(["invoiced", "late", "debt"]);

/** Emails to clients are opt-in, so deploying never emails customers by surprise. */
const clientEmailsOn = () => process.env.AUTOMATIONS_CLIENT_EMAILS === "on";

// ------------------------------------------------------------------ scheduling

/** Subscriber for payment record events. */
export async function onPaymentEvent(e: RecordEvent): Promise<void> {
  const p = e.after;
  if (!p) return;

  if (e.kind === "created" || e.changed.includes("due") || e.changed.includes("status")) {
    await schedulePaymentJobs(e.organizationId, String(p.id), String(p.due ?? ""), String(p.status ?? ""));
  }

  // Someone raised the counter by hand past the threshold.
  if (e.changed.includes("reminders") && Number(p.reminders) >= (await debtAfter())) {
    await escalateDebt(e.organizationId, String(p.id));
  }
}

export async function schedulePaymentJobs(organizationId: string, paymentId: string, due: string, status: string) {
  if (!due || status === "paid") return;
  const boss = await getBoss();
  const today = todayIso();
  const now = Date.now();

  for (const { rule, offset } of STEPS) {
    const day = addDaysIso(due, offset);
    if (day < today) continue; // past steps are not sent retroactively
    const at = atLocalHour(day);
    const job: PaymentJob = { organizationId, paymentId, rule, offset, due: due.slice(0, 10) };
    // The exclusive queue ignores a key that is already queued, so re-saving a
    // payment doesn't pile up duplicate jobs.
    await boss.send(QUEUES.paymentReminder, job, {
      singletonKey: `${paymentId}:${rule}:${offset}:${job.due}`,
      ...(at.getTime() > now ? { startAfter: at } : {}),
    });
  }
}

// --------------------------------------------------------------------- running

type Loaded = { payment: Payment; facts: PaymentFacts; client: ClientInfo | null };

async function load(organizationId: string, paymentId: string): Promise<Loaded | null> {
  const repo = await getRepository(Payment);
  const payment = await repo.findOne({ where: { id: paymentId, organizationId } });
  if (!payment) return null;
  const client = await clientInfo(organizationId, payment.client);
  return {
    payment,
    client,
    facts: { client: client?.name ?? "—", net: payment.net, due: payment.due, invoice: payment.invoice },
  };
}

/** Worker handler for one queued payment step. */
export async function runPaymentJob(job: PaymentJob): Promise<void> {
  const loaded = await load(job.organizationId, job.paymentId);
  if (!loaded) return;
  const { payment } = loaded;
  if (payment.due.slice(0, 10) !== job.due) return; // due date moved; newer jobs exist
  if (payment.status === "paid") return;
  if (!(await isRuleOn(job.organizationId, job.rule))) return;

  if (job.rule === 1) return sendInvoiceDueSoon(job, loaded);
  return sendClientReminder(job, loaded);
}

async function sendInvoiceDueSoon(job: PaymentJob, { payment, facts }: Loaded) {
  if (payment.status !== "planned") return; // already invoiced
  const to = await managers(job.organizationId);
  if (!to.length) return;

  await runOnce(
    {
      organizationId: job.organizationId, rule: 1, coll: "payments", recordId: payment.id,
      channel: "email", dedupeKey: `payment:${payment.id}:r1:${job.due}`,
    },
    async () => {
      const email = invoiceDueSoonEmail(facts, -job.offset);
      await sendEmail({ to: to[0].email, cc: to.slice(1).map((m) => m.email), ...email });
      return { status: "sent", detail: { to: to.map((m) => m.email) } };
    }
  );
}

async function sendClientReminder(job: PaymentJob, { payment, facts, client }: Loaded) {
  if (!UNPAID.has(payment.status)) return; // not invoiced yet

  const orgId = job.organizationId;
  const contact = client ? await billingContact(orgId, client.id) : null;
  const owner = job.rule === 3 && client ? await profile(orgId, client.owner) : null;

  const sent = await runOnce(
    {
      organizationId: orgId, rule: job.rule, coll: "payments", recordId: payment.id,
      channel: "email", dedupeKey: `payment:${payment.id}:r${job.rule}:${job.offset}:${job.due}`,
    },
    async () => {
      if (!contact) {
        await notifyMissingContact(orgId, client, facts);
        return { status: "skipped", detail: { reason: "no billing contact email" } };
      }
      if (!clientEmailsOn()) {
        return { status: "skipped", detail: { reason: "AUTOMATIONS_CLIENT_EMAILS is off", to: contact.email } };
      }
      const email = paymentReminderEmail(facts, {
        contactName: contact.name,
        orgName: await orgName(orgId),
        daysOverdue: job.offset,
      });
      await sendEmail({ to: contact.email, cc: owner ? [owner.email] : [], ...email });
      return { status: "sent", detail: { to: contact.email, cc: owner?.email ?? null } };
    }
  );
  if (!sent) return;

  const reminders = await bumpReminders(payment.id);
  if (reminders >= (await debtAfter())) await escalateDebt(orgId, payment.id);
}

async function notifyMissingContact(orgId: string, client: ClientInfo | null, facts: PaymentFacts) {
  const owner = client ? await profile(orgId, client.owner) : null;
  const to: Person[] = owner ? [owner] : await managers(orgId);
  if (!to.length) return;
  const email = missingContactEmail(facts);
  await sendEmail({ to: to[0].email, cc: to.slice(1).map((m) => m.email), ...email });
}

async function bumpReminders(paymentId: string): Promise<number> {
  const repo = await getRepository(Payment);
  await repo.increment({ id: paymentId }, "reminders", 1);
  const row = await repo.findOne({ where: { id: paymentId }, select: { id: true, reminders: true } });
  return row?.reminders ?? 0;
}

// ---------------------------------------------------------------------- rule 4

async function escalateDebt(organizationId: string, paymentId: string): Promise<void> {
  if (!(await isRuleOn(organizationId, 4))) return;
  const loaded = await load(organizationId, paymentId);
  if (!loaded || loaded.payment.status === "paid") return;
  const { payment, facts, client } = loaded;

  await runOnce(
    {
      organizationId, rule: 4, coll: "payments", recordId: payment.id,
      channel: "task", dedupeKey: `payment:${payment.id}:r4`,
    },
    async () => {
      const today = todayIso();
      const daysOverdue = Math.max(0, daysBetweenIso(payment.due, today));
      const mgrs = await managers(organizationId);
      const assignee = client?.owner ?? mgrs[0]?.id ?? null;

      await (await getRepository(Payment)).update({ id: payment.id }, { status: "debt" });

      const tasks = await getRepository(Task);
      const task = await tasks.save(tasks.create({
        organizationId,
        titleHe: `לגבות חוב — ${facts.client}`,
        titleEn: `Collect debt — ${facts.client}`,
        domain: "collection",
        client: payment.client,
        assignee,
        priority: "urgent",
        due: today,
        status: "todo",
        src: "automation",
      }));

      // The status and task are already saved, so a failed email must not
      // throw (a retry would create a second task); it is recorded instead.
      let emailError: string | null = null;
      if (mgrs.length) {
        try {
          const email = debtEscalationEmail(facts, payment.reminders, daysOverdue);
          await sendEmail({ to: mgrs[0].email, cc: mgrs.slice(1).map((m) => m.email), ...email });
        } catch (err) {
          emailError = (err as Error).message;
          console.error(`[automations] rule 4 email failed for payment ${payment.id}`, err);
        }
      }
      return {
        status: "sent",
        detail: { taskId: task.id, assignee, notified: mgrs.map((m) => m.email), emailError },
      };
    }
  );
}
