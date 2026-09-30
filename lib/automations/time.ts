/** Timezone automations run in. Reminders go out at SEND_HOUR local time. */
export const TZ = process.env.AUTOMATIONS_TZ || "Asia/Jerusalem";
export const SEND_HOUR = 12;

/** Today's date in TZ, as YYYY-MM-DD. */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Whole days from a to b (both YYYY-MM-DD). */
export function daysBetweenIso(a: string, b: string): number {
  const t = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  return Math.round((t(b) - t(a)) / 86_400_000);
}

/** How far TZ is ahead of UTC at a given instant, in ms. */
function tzOffsetMs(at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(at).map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - at.getTime();
}

/** The instant at which it is `hour`:00 in TZ on the given date. */
export function atLocalHour(iso: string, hour = SEND_HOUR): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour);
  return new Date(guess - tzOffsetMs(new Date(guess)));
}
