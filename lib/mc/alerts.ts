import { rows, getSettings, type CollName, type Rec } from "./store";
import { daysAgo, daysTo, todayIso, shiftIso, fmtDate } from "./format";
import { L } from "./i18n";
import { enumLabel } from "./enums";
import {
  gapDays, isStuck, lastContactDays, nextReport, overdue, paceOf,
  payStatus, progressOf, redeemedPct, stageSla
} from "./compute";
import { nameOf, SCHEMA } from "./schema";

export type Alert = {
  severity: 1 | 2 | 3;
  rule: number;
  title: string;
  detail: string;
  target: { coll: CollName; id: string };
  task?: Rec;
};

/**
 * Evaluates the automation rules against current data.
 * Rules switched off in the `automations` table are filtered out.
 */
export function buildAlerts(): Alert[] {
  const s = getSettings();
  const out: Alert[] = [];
  const push = (
    severity: Alert["severity"], rule: number, title: string, detail: string,
    coll: CollName, id: string, task?: Rec
  ) => out.push({ severity, rule, title, detail, target: { coll, id }, task });

  const D = (he: string, en: string) => L({ he, en });

  rows("payments").forEach((p) => {
    const st = payStatus(p);
    const o = overdue(p);
    const client = nameOf("clients", p.client);
    if (st === "debt") {
      push(3, 4, `${D("חוב פתוח", "Open debt")} · ${client}`,
        `${o} ${D("ימי פיגור", "days overdue")} · ${Number(p.reminders) || 0} ${D("תזכורות", "reminders")}`,
        "payments", p.id,
        { titleHe: `לגבות חוב — ${client}`, titleEn: `Collect debt — ${client}`, domain: "collection", client: p.client, priority: "urgent", due: todayIso() });
    } else if (st === "late") {
      push(2, 3, `${D("תשלום באיחור", "Late payment")} · ${client}`, `${o} ${D("ימים", "days")}`, "payments", p.id);
    } else if (st === "planned") {
      const d = daysTo(p.due);
      if (d != null && d >= 0 && d <= 7) {
        push(1, 1, `${D("תשלום מתקרב", "Payment due soon")} · ${client}`,
          `${D("בעוד", "in")} ${d} ${D("ימים", "days")}`, "payments", p.id);
      }
    }
  });

  rows("deals").forEach((d) => {
    if (["won", "lost"].includes(d.stage)) return;
    const title = SCHEMA.deals.title(d);
    if (isStuck(d)) {
      push(3, 6, `${D("עסקה תקועה", "Stuck deal")} · ${title}`,
        `${daysAgo(d.stageSince)} ${D("ימים בשלב", "days in")} ${enumLabel("stage", d.stage)} · SLA ${stageSla(d.stage)}`,
        "deals", d.id);
    }
    const g = gapDays(d);
    if (g != null && !d.po && g > s.gapOk) {
      const client = nameOf("clients", d.client);
      push(3, 5, `${D("פער בע״פ→הזמנה", "Verbal→PO gap")} · ${title}`,
        `${g} ${D("ימים ללא הזמנת עבודה", "days without a PO")}`, "deals", d.id,
        { titleHe: `לדחוף להזמנת עבודה — ${client}`, titleEn: `Push for the PO — ${client}`, domain: "sales", client: d.client, deal: d.id, priority: "high", due: shiftIso(2) });
    }
    if (!d.next) {
      push(1, 7, `${D("עסקה ללא צעד הבא", "Deal with no next step")} · ${title}`,
        `${enumLabel("stage", d.stage)} · ${nameOf("clients", d.client)}`, "deals", d.id);
    }
  });

  rows("tasks").forEach((k) => {
    if (k.status === "done") return;
    const d = daysAgo(k.due);
    const who = nameOf("users", k.assignee);
    if (d != null && d > 0) {
      push(2, 19, SCHEMA.tasks.title(k), `${D("באיחור", "Overdue")} ${d} ${D("ימים", "days")} · ${who}`, "tasks", k.id);
    } else if (d === 0) {
      push(1, 19, SCHEMA.tasks.title(k), `${D("היעד היום", "Due today")} · ${who}`, "tasks", k.id);
    }
  });

  rows("tenders").forEach((x) => {
    if (["won", "lost"].includes(x.status)) return;
    const d = daysTo(x.submission);
    if (d != null && d >= 0 && d <= 14) {
      const missing = (x.docs || []).filter((v: Rec) => v.req && !v.ok).length;
      push(d <= 3 ? 3 : 2, 8, `${D("מכרז", "Tender")} ${x.num} · ${nameOf("clients", x.client)}`,
        `${D("הגשה בעוד", "submission in")} ${d} ${D("ימים", "days")}${missing ? ` · ${missing} ${D("מסמכים חסרים", "documents missing")}` : ""}`,
        "tenders", x.id);
    }
    const ge = daysTo(x.guaranteeExpiry);
    if (ge != null && ge >= 0 && ge <= 30) {
      push(2, 10, `${D("ערבות פוקעת", "Guarantee expiring")} · ${D("מכרז", "tender")} ${x.num}`,
        `${D("בעוד", "in")} ${ge} ${D("ימים", "days")}`, "tenders", x.id);
    }
  });

  rows("interactions").forEach((i) => {
    const d = daysAgo(i.date);
    if (!i.documented && d != null && d >= 1) {
      const client = nameOf("clients", i.client);
      push(2, 13, `${D("תיעוד חסר", "Documentation missing")} · ${client}`,
        `${enumLabel("interactionType", i.type)} · ${d} ${D("ימים", "days ago")}`, "interactions", i.id,
        { titleHe: `להשלים תיעוד — ${client}`, titleEn: `Complete the notes — ${client}`, domain: "doc", client: i.client, priority: "high", due: todayIso() });
    }
  });

  rows("clients").forEach((c) => {
    const title = SCHEMA.clients.title(c);
    const v = daysTo(c.validUntil);
    if (v != null && v >= 0 && v <= 60) {
      push(2, 11, `${D("תוקף התקשרות", "Engagement expiring")} · ${title}`,
        `${c.engagement ? `${enumLabel("engagement", c.engagement)} · ` : ""}${D("בעוד", "in")} ${v} ${D("ימים", "days")}`,
        "clients", c.id,
        { titleHe: `לחדש התקשרות — ${title}`, titleEn: `Renew the engagement — ${title}`, domain: "ops", client: c.id, priority: "med", due: shiftIso(7) });
    }
    if (c.status === "active") {
      const lc = lastContactDays(c.id);
      if (lc != null && lc > 90) {
        push(1, 23, `${D("90 יום ללא קשר", "90 days without contact")} · ${title}`,
          `${D("קשר אחרון לפני", "last contact")} ${lc} ${D("ימים", "days ago")}`, "clients", c.id,
          { titleHe: `ליצור קשר — ${title}`, titleEn: `Reach out — ${title}`, domain: "sales", client: c.id, priority: "med", due: shiftIso(3) });
      }
    }
  });

  rows("contracts").forEach((k) => {
    if (k.status !== "signed") return;
    const d = daysTo(k.end);
    if (d != null && d >= 0 && d <= 90) {
      push(2, 12, `${D("חוזה מסתיים", "Contract ending")} · ${nameOf("clients", k.client)}`,
        `${k.po || ""} · ${D("בעוד", "in")} ${d} ${D("ימים", "days")}`, "contracts", k.id);
    }
  });

  rows("quotes").forEach((q) => {
    const d = daysTo(q.valid);
    if (["sent", "review"].includes(q.status) && d != null && d < 0) {
      push(2, 16, `${D("הצעת מחיר פגה", "Quote expired")} · ${nameOf("deals", q.deal)}`,
        `${D("פג לפני", "expired")} ${-d} ${D("ימים", "days ago")}`, "quotes", q.id);
    }
  });

  rows("batches").forEach((b) => {
    const d = daysTo(b.expiry);
    const p = redeemedPct(b);
    if (d != null && d >= 0 && d <= 30 && p < 70) {
      push(2, 21, `${D("מנת תווים פוקעת", "Voucher batch expiring")} · ${nameOf("campaigns", b.campaign)}`,
        `${D("בעוד", "in")} ${d} ${D("ימים", "days")} · ${D("מומש", "redeemed")} ${p}%`, "batches", b.id);
    }
  });

  rows("campaigns").forEach((c) => {
    if (c.status !== "live") return;
    const p = paceOf(c);
    if (p != null && p < 0.7) {
      push(2, 22, `${D("קמפיין מפגר ביעד", "Campaign behind target")} · ${SCHEMA.campaigns.title(c)}`,
        `${D("קצב", "pace")} ${p.toFixed(2)} · ${Math.round(progressOf(c))}%`, "campaigns", c.id);
    }
  });

  rows("partners").forEach((p) => {
    if (p.status !== "active") return;
    const n = nextReport(p);
    const d = n ? daysTo(n) : null;
    if (n && d != null && d < 0) {
      push(1, 20, `${D("דיווח לשותף באיחור", "Partner report overdue")} · ${SCHEMA.partners.title(p)}`,
        `${D("מועד", "due")} ${fmtDate(n)}`, "partners", p.id);
    }
  });

  rows("merchants").forEach((m) => {
    if (m.status !== "active") return;
    const d = daysAgo(m.last);
    if (d != null && d > 60) {
      push(1, 24, `${D("עסק ללא מימוש", "Inactive business")} · ${SCHEMA.merchants.title(m)}`,
        `${d} ${D("ימים ללא מימוש", "days without a redemption")}`, "merchants", m.id);
    }
  });

  const rules = rows("automations");
  const enabled = new Set(rules.filter((a) => a.on !== false).map((a) => Number(a.n)));
  const filtered = rules.length ? out.filter((a) => enabled.has(a.rule)) : out;
  return filtered.sort((a, b) => b.severity - a.severity);
}
