import type { PgBoss } from "pg-boss";

/** Queue names. Every queue must be listed here so getBoss() creates it. */
export const QUEUES = {
  /** A record in an mc collection was created, updated or deleted. */
  recordEvent: "record-event",
  /** One step of a payment's reminder schedule (rules 1–3). */
  paymentReminder: "payment-reminder",
} as const;

// Survives Next dev hot reloads, so we never open a second pool.
const g = globalThis as unknown as { __mcBoss?: Promise<PgBoss> };

async function createBoss(): Promise<PgBoss> {
  // pg-boss is ESM-only; load it at runtime rather than through the bundler.
  const { PgBoss } = await import("pg-boss");
  const boss = new PgBoss({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USERNAME || "pacecode",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "metgo_crm",
    schema: "pgboss",
    application_name: "metgo-crm-automations",
  });
  boss.on("error", (err) => console.error("[automations] pg-boss error", err));
  await boss.start();

  await boss.createQueue(QUEUES.recordEvent, {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  });
  await boss.createQueue(QUEUES.paymentReminder, {
    // one queued job per singletonKey (payment + step + due date)
    policy: "exclusive",
    // reminders are queued up to ~2 months ahead; pg-boss's default would
    // delete a job still waiting after 14 days
    retentionSeconds: 400 * 24 * 60 * 60,
    retryLimit: 5,
    retryDelay: 60,
    retryBackoff: true,
  });
  return boss;
}

/**
 * The process-wide pg-boss instance, started on first use. pg-boss creates and
 * migrates its own `pgboss` schema on start, so it needs no TypeORM migration.
 */
export function getBoss(): Promise<PgBoss> {
  if (!g.__mcBoss) {
    g.__mcBoss = createBoss().catch((err) => {
      g.__mcBoss = undefined; // let the next call retry
      throw err;
    });
  }
  return g.__mcBoss;
}
