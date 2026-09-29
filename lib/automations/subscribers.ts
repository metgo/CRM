import type { RecordEvent } from "./events";
import { onPaymentEvent } from "./payments";

/**
 * Reacts to a record event. Runs inside the worker, so it may throw to have
 * pg-boss retry the event; it must therefore be safe to run more than once
 * (write to automation_log with a dedupe key before any outbound action).
 */
export type Subscriber = (event: RecordEvent) => Promise<void>;

/** Subscribers per collection. Rules are wired in here as they are built. */
const SUBSCRIBERS: Partial<Record<string, Subscriber[]>> = {
  payments: [onPaymentEvent], // rules 1–4
};

export async function dispatchRecordEvent(event: RecordEvent): Promise<void> {
  for (const sub of SUBSCRIBERS[event.coll] ?? []) {
    await sub(event);
  }
}
