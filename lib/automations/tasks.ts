import { getRepository, Task } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { getBoss, QUEUES } from "./boss";
import type { RecordEvent } from "./events";
import { runOnce } from "./log";
import { isRuleOn, profile } from "./lookup";
import { taskAssignedEmail, taskReminderEmail, type TaskFacts } from "./emails";
import { addDaysIso, atLocalHour, daysBetweenIso, todayIso } from "./time";

/**
 * Task notifications — automation rules 18 and 19.
 *
 *   rule 18  task assigned                 email the new assignee immediately
 *   rule 19  due − 1, due, due + 1 …       email the assignee; daily once overdue
 *
 * Rule 18 runs straight from the record event. Rule 19 queues jobs: one for
 * the day before, one for the due date, and one for the first overdue day,
 * which re-queues itself for the next day while the task stays open (up to
 * MAX_OVERDUE_DAYS). Each job re-reads the task and does nothing if it is
 * done, deleted, unassigned, or its due date moved.
 */

export type TaskJob = {
  organizationId: string;
  taskId: string;
  /** Days relative to due: -1 day before, 0 due date, ≥1 overdue. */
  offset: number;
  due: string;
};

/** Stop the daily overdue reminders after this many days. */
const MAX_OVERDUE_DAYS = 30;

const facts = (t: { titleHe: string; titleEn: string | null; due: string; priority: string | null }): TaskFacts => ({
  title: t.titleHe || t.titleEn || "—",
  due: t.due,
  priority: t.priority,
});

// ------------------------------------------------------------------ event

/** Subscriber for task record events. */
export async function onTaskEvent(e: RecordEvent): Promise<void> {
  const t = e.after;
  if (!t) return;

  const assigned = e.kind === "created" ? Boolean(t.assignee) : e.changed.includes("assignee") && Boolean(t.assignee);
  if (assigned && t.status !== "done") await notifyAssigned(e);

  if (e.kind === "created" || e.changed.includes("due") || e.changed.includes("status")) {
    await scheduleTaskJobs(e.organizationId, String(t.id), String(t.due ?? ""), String(t.status ?? ""));
  }
}

async function notifyAssigned(e: RecordEvent) {
  const t = e.after!;
  const assignee = String(t.assignee);
  if (assignee === e.userId) return; // assigning yourself needs no email
  if (!(await isRuleOn(e.organizationId, 18))) return;

  const to = await profile(e.organizationId, assignee);
  if (!to) return;
  const by = await profile(e.organizationId, e.userId);

  await runOnce(
    {
      organizationId: e.organizationId, rule: 18, coll: "tasks", recordId: e.id,
      // one email per assignment; a retry of the same event reuses the key
      channel: "email", dedupeKey: `task:${e.id}:r18:${assignee}:${e.at}`,
    },
    async () => {
      const email = taskAssignedEmail(
        facts({
          titleHe: String(t.titleHe ?? ""), titleEn: (t.titleEn as string | null) ?? null,
          due: String(t.due), priority: (t.priority as string | null) ?? null,
        }),
        by?.name ?? null
      );
      await sendEmail({ to: to.email, ...email });
      return { status: "sent", detail: { to: to.email, by: by?.email ?? null } };
    }
  );
}

// ------------------------------------------------------------------ scheduling

async function scheduleTaskJobs(organizationId: string, taskId: string, due: string, status: string) {
  if (!due || status === "done") return;
  const d = due.slice(0, 10);
  const today = todayIso();

  // Day before and due date, when still ahead; plus the first overdue day that
  // hasn't passed (today, if the task is already overdue).
  const offsets = [-1, 0].filter((o) => addDaysIso(d, o) >= today);
  offsets.push(Math.max(1, daysBetweenIso(d, today)));

  for (const offset of offsets) {
    if (offset > MAX_OVERDUE_DAYS) continue;
    await queueStep({ organizationId, taskId, offset, due: d });
  }
}

async function queueStep(job: TaskJob) {
  const boss = await getBoss();
  const at = atLocalHour(addDaysIso(job.due, job.offset));
  await boss.send(QUEUES.taskReminder, job, {
    singletonKey: `${job.taskId}:${job.offset}:${job.due}`,
    ...(at.getTime() > Date.now() ? { startAfter: at } : {}),
  });
}

// --------------------------------------------------------------------- running

/** Worker handler for one queued task reminder. */
export async function runTaskJob(job: TaskJob): Promise<void> {
  const repo = await getRepository(Task);
  const task = await repo.findOne({ where: { id: job.taskId, organizationId: job.organizationId } });
  if (!task) return;
  if (task.due.slice(0, 10) !== job.due) return; // due date moved; newer jobs exist
  if (task.status === "done") return;
  if (!(await isRuleOn(job.organizationId, 19))) return;

  const to = task.assignee ? await profile(job.organizationId, task.assignee) : null;
  if (to) {
    await runOnce(
      {
        organizationId: job.organizationId, rule: 19, coll: "tasks", recordId: task.id,
        channel: "email", dedupeKey: `task:${task.id}:r19:${job.due}:${job.offset}`,
      },
      async () => {
        await sendEmail({ to: to.email, ...taskReminderEmail(facts(task), job.offset) });
        return { status: "sent", detail: { to: to.email, offset: job.offset } };
      }
    );
  }

  // Still open and overdue: remind again tomorrow.
  if (job.offset >= 1 && job.offset < MAX_OVERDUE_DAYS) {
    await queueStep({ ...job, offset: job.offset + 1 });
  }
}
