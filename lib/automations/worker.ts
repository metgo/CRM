import { getBoss, QUEUES } from "./boss";
import type { RecordEvent } from "./events";
import { runPaymentJob, type PaymentJob } from "./payments";
import { dispatchRecordEvent } from "./subscribers";

const g = globalThis as unknown as { __mcWorkerStarted?: boolean };

/**
 * Registers the automation job handlers on this process. Called once from
 * instrumentation.ts. Safe with several containers: pg-boss hands each job to
 * exactly one worker.
 */
export async function startAutomationWorker(): Promise<void> {
  if (g.__mcWorkerStarted) return;
  g.__mcWorkerStarted = true;

  try {
    const boss = await getBoss();
    await boss.work<RecordEvent>(QUEUES.recordEvent, async ([job]) => {
      await dispatchRecordEvent(job.data);
    });
    await boss.work<PaymentJob>(QUEUES.paymentReminder, async ([job]) => {
      await runPaymentJob(job.data);
    });
    console.log("[automations] worker started");
  } catch (err) {
    g.__mcWorkerStarted = false;
    console.error("[automations] worker failed to start", err);
  }
}
