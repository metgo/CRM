/**
 * Next.js runs register() once when the server starts. It starts the
 * automation worker in this process unless AUTOMATIONS_WORKER=off (e.g. to
 * run web-only containers alongside a dedicated worker container).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.AUTOMATIONS_WORKER === "off") return;

  const { startAutomationWorker } = await import("./lib/automations/worker");
  await startAutomationWorker();
}
