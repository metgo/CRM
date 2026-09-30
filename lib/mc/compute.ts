import { getSettings, rows, type Rec } from "./store";
import { daysAgo, daysBetween, parseDate, today } from "./format";
import { E } from "./enums";

export const vatRate = () => (getSettings().vat ?? 18) / 100;

export const stageSla = (stage?: string): number => {
  const s = getSettings();
  const map: Record<string, number> = {
    lead: s.slaLead, meeting: s.slaMeeting, quote: s.slaQuote, verbal: s.slaVerbal, po: s.slaPo
  };
  return (stage && map[stage]) || 0;
};

export const isStuck = (d: Rec): boolean => {
  if (!d || d.stage === "won" || d.stage === "lost") return false;
  const n = daysAgo(d.stageSince);
  const sla = stageSla(d.stage);
  return n != null && sla > 0 && n > sla;
};

export const gapDays = (d: Rec): number | null => {
  if (!d?.verbal) return null;
  return daysBetween(parseDate(d.verbal), d.po ? parseDate(d.po) : today());
};

export const quoteNet = (q: Rec): number =>
  (q.lines || []).reduce((s: number, l: Rec) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0) ||
  Number(q.net) || 0;

export const overdue = (p: Rec): number => {
  if (p.status === "paid" || p.status === "planned") return 0;
  const d = daysAgo(p.due);
  return d && d > 0 ? d : 0;
};

/** The stored status, upgraded by the live reminder count and due date. */
export const payStatus = (p: Rec): string => {
  if (p.status === "paid" || p.status === "planned") return p.status;
  if ((Number(p.reminders) || 0) >= getSettings().debtAfter) return "debt";
  if (overdue(p) > 0) return "late";
  return p.status || "planned";
};

const BATCH_KEYS = ["cIssued", "cActive", "cPartial", "cRedeemed", "cExpired"] as const;

export const batchTotal = (b: Rec): number =>
  BATCH_KEYS.reduce((s, k) => s + (Number(b[k]) || 0), 0);

export const redeemedPct = (b: Rec): number => {
  const tot = batchTotal(b);
  if (!tot) return 0;
  return Math.round((((Number(b.cRedeemed) || 0) + (Number(b.cPartial) || 0) * 0.5) / tot) * 100);
};

export const progressOf = (c: Rec): number =>
  Number(c.goal) ? Math.min(999, ((Number(c.currentValue) || 0) / Number(c.goal)) * 100) : 0;

export const paceOf = (c: Rec): number | null => {
  const span = daysBetween(parseDate(c.start), parseDate(c.end));
  if (!span || span <= 0) return null;
  const elapsed = Math.max(0, Math.min(span, daysBetween(parseDate(c.start), today()) || 0));
  const timePct = (elapsed / span) * 100;
  return timePct > 3 ? progressOf(c) / timePct : null;
};

export const nextReport = (p: Rec): string | null => {
  const d = parseDate(p.lastReport);
  if (!d) return null;
  d.setDate(d.getDate() + (Number(p.cadence) || 14));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const lastContactDays = (clientId: string): number | null => {
  const dates = rows("interactions")
    .filter((i) => i.client === clientId && i.date)
    .map((i) => String(i.date).slice(0, 10))
    .sort();
  return dates.length ? daysAgo(dates[dates.length - 1]) : null;
};

export type Aggregates = ReturnType<typeof aggregates>;

export function aggregates() {
  const P = rows("payments");
  const D = rows("deals");
  const B = rows("batches");
  const M = rows("merchants");
  const s = getSettings();

  const openDebt = P.filter((p) => ["debt", "late"].includes(payStatus(p)))
    .reduce((sum, p) => sum + (Number(p.net) || 0), 0);
  const collected = P.filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (Number(p.paidAmount) || Number(p.net) || 0), 0);
  const committed = P.filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + (Number(p.net) || 0), 0);
  const weighted = D.filter((d) => !["won", "lost"].includes(d.stage))
    .reduce((sum, d) => sum + (Number(d.net) || 0) * ((E.stage[d.stage]?.prob || 0) / 100), 0);

  const voucherCounts = B.reduce<Record<string, number>>((acc, b) => {
    BATCH_KEYS.forEach((k) => (acc[k] = (acc[k] || 0) + (Number(b[k]) || 0)));
    return acc;
  }, {});

  return {
    openDebt,
    collected,
    committed,
    weighted,
    forecast: collected + committed + weighted,
    target: Number(s.targetYear) || 0,
    debtClients: new Set(P.filter((p) => payStatus(p) === "debt").map((p) => p.client)).size,
    debtOver60: P.filter((p) => overdue(p) > 60).reduce((sum, p) => sum + (Number(p.net) || 0), 0),
    openDeals: D.filter((d) => !["won", "lost"].includes(d.stage)),
    won: D.filter((d) => d.stage === "won"),
    stuck: D.filter(isStuck),
    commission: D.filter((d) => d.stage === "won")
      .reduce((sum, d) => sum + (Number(d.net) || 0) * ((Number(d.commissionPct) || 0) / 100), 0),
    voucherCounts,
    openLiability: B.reduce(
      (sum, b) =>
        sum +
        ((Number(b.cIssued) || 0) + (Number(b.cActive) || 0) + (Number(b.cPartial) || 0)) *
          (Number(b.face) || 0),
      0
    ),
    toBusinesses: M.reduce((sum, m) => sum + (Number(m.revenue) || 0), 0),
    redemptionCount: M.reduce((sum, m) => sum + (Number(m.redemptions) || 0), 0),
    newMerchants: M.filter((m) => {
      const d = daysAgo(m.joined);
      return d != null && d <= 365;
    }).length
  };
}
