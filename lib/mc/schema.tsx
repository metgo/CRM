import type { ReactNode } from "react";
import type { Bi } from "./i18n";
import { L, lang, t } from "./i18n";
import { enumLabel } from "./enums";
import { getRec, rows, type CollName, type Rec } from "./store";
import { daysAgo, daysTo, dayWord, fmtDate, fmtN } from "./format";
import {
  gapDays, isStuck, lastContactDays, nextReport, overdue, payStatus,
  paceOf, progressOf, quoteNet, redeemedPct
} from "./compute";
import { DateText, Meter, Money, Num, Pill } from "@/components/mc/ui";
import { getSettings } from "./store";

export type FieldType =
  | "text" | "textarea" | "num" | "money" | "pct" | "date"
  | "enum" | "ref" | "refs" | "bool" | "list";

export type Field = {
  k: string;
  t: FieldType;
  l: Bi;
  e?: string;          // enum group
  c?: CollName;        // referenced collection
  req?: boolean;
  def?: unknown;
  hint?: Bi;
  sub?: Field[];       // for t === "list"
};

export type Column = { h: Bi; cell: (r: Rec) => ReactNode };

export type Schema = {
  group: string;
  icon: string;
  title: (r: Rec) => string;
  fields: Field[];
  cols: Column[];
  related?: Array<[CollName, string]>;
  meta?: (r: Rec) => ReactNode;
  sort?: (a: Rec, b: Rec) => number;
  beforeSave?: (next: Rec, prev?: Rec) => void;
};

const f = (k: string, ty: FieldType, he: string, en: string, extra: Partial<Field> = {}): Field =>
  ({ k, t: ty, l: { he, en }, ...extra });

const nameFields = (he = "שם (עברית)", en = "Name (Hebrew)"): Field[] => [
  f("nameHe", "text", he, en, { req: true }),
  f("nameEn", "text", "שם (אנגלית)", "Name (English)")
];

/** Bilingual display of a record's `<base>He` / `<base>En` pair. */
export const disp = (r: Rec | undefined, base: string): string => {
  if (!r) return "—";
  const he = r[`${base}He`];
  const en = r[`${base}En`];
  return (lang() === "he" ? he || en : en || he) || r[base] || "—";
};

export const nameOf = (coll: CollName, id?: string | null): string => {
  const r = getRec(coll, id);
  if (!r) return "—";
  return SCHEMA[coll].title(r);
};
const Ref = ({ coll, id }: { coll: CollName; id?: string | null }) => <>{id ? nameOf(coll, id) : "—"}</>;

export const SCHEMA: Record<CollName, Schema> = {
  users: {
    group: "g_system", icon: "☺",
    title: (r) => disp(r, "name"),
    fields: [
      ...nameFields("שם", "Name"),
      f("role", "text", "תפקיד", "Role"),
      f("email", "text", "מייל", "Email"),
      f("active", "bool", "פעיל", "Active", { def: true })
    ],
    cols: [
      { h: { he: "שם", en: "Name" }, cell: (r) => <b>{disp(r, "name")}</b> },
      { h: { he: "תפקיד", en: "Role" }, cell: (r) => r.role || "—" },
      { h: { he: "מייל", en: "Email" }, cell: (r) => <span className="mono">{r.email || "—"}</span> },
      { h: { he: "פעיל", en: "Active" }, cell: (r) => (r.active !== false ? <Pill tone="p-ok">✓</Pill> : <Pill>—</Pill>) }
    ]
  },

  clients: {
    group: "g_clients", icon: "◉",
    title: (r) => disp(r, "name"),
    fields: [
      ...nameFields(),
      f("type", "enum", "סוג לקוח", "Client type", { e: "clientType", req: true, def: "authority" }),
      f("status", "enum", "סטטוס", "Status", { e: "clientStatus", req: true, def: "lead" }),
      f("cluster", "ref", "אשכול", "Cluster", { c: "clusters" }),
      f("region", "enum", "מחוז", "Region", { e: "region" }),
      f("population", "num", "אוכלוסייה", "Population"),
      f("engagement", "enum", "סוג התקשרות", "Engagement type", { e: "engagement" }),
      f("validUntil", "date", "תוקף ההתקשרות", "Engagement valid until", {
        hint: { he: "מפעיל התראה 60 ו־30 יום לפני", en: "Alerts 60 and 30 days before" }
      }),
      f("owner", "ref", "מנהל תיק", "Account owner", { c: "users" }),
      f("source", "enum", "מקור", "Source", { e: "source" }),
      f("satisfaction", "num", "שביעות רצון (1–5)", "Satisfaction (1–5)"),
      f("activated", "date", "הפך לפעיל", "Activated on"),
      f("phone", "text", "טלפון", "Phone"),
      f("address", "text", "כתובת", "Address"),
      f("notes", "textarea", "הערות", "Notes")
    ],
    cols: [
      { h: { he: "שם", en: "Name" }, cell: (r) => <b>{disp(r, "name")}</b> },
      { h: { he: "סוג", en: "Type" }, cell: (r) => <Pill group="clientType" value={r.type} /> },
      { h: { he: "סטטוס", en: "Status" }, cell: (r) => <Pill group="clientStatus" value={r.status} /> },
      { h: { he: "מחוז", en: "Region" }, cell: (r) => enumLabel("region", r.region) || "—" },
      { h: { he: "סוג התקשרות", en: "Engagement" }, cell: (r) => enumLabel("engagement", r.engagement) || "—" },
      {
        h: { he: "תוקף", en: "Valid until" },
        cell: (r) => {
          const d = daysTo(r.validUntil);
          if (d == null) return "—";
          return d <= 60 ? <Pill tone={d < 0 ? "p-dan" : "p-warn"}>{fmtDate(r.validUntil)}</Pill> : <DateText v={r.validUntil} />;
        }
      },
      { h: { he: "מנהל תיק", en: "Owner" }, cell: (r) => <Ref coll="users" id={r.owner} /> },
      {
        h: { he: "קשר אחרון", en: "Last contact" },
        cell: (r) => {
          const d = lastContactDays(r.id);
          if (d == null) return "—";
          return d > 90 ? <Pill tone="p-warn">{dayWord(d)}</Pill> : <Num>{dayWord(d)}</Num>;
        }
      }
    ],
    related: [
      ["deals", "client"], ["payments", "client"], ["contracts", "client"],
      ["interactions", "client"], ["tasks", "client"], ["merchants", "client"], ["tenders", "client"]
    ],
    meta: (r) => (
      <>
        <Pill group="clientType" value={r.type} />
        <Pill group="clientStatus" value={r.status} />
        {r.owner ? <span className="hint">{nameOf("users", r.owner)}</span> : null}
      </>
    )
  },

  clusters: {
    group: "g_clients", icon: "⬡",
    title: (r) => disp(r, "name"),
    fields: [
      ...nameFields(),
      f("region", "enum", "מחוז", "Region", { e: "region" }),
      f("members", "refs", "רשויות חברות", "Member authorities", { c: "clients" }),
      f("scope", "enum", "סוג הסכם", "Agreement scope", {
        e: "clusterScope", hint: { he: "קובע למי מונפקת החשבונית", en: "Determines who gets invoiced" }
      }),
      f("contact", "ref", "איש קשר מרכזי", "Primary contact", { c: "contacts" }),
      f("notes", "textarea", "הערות", "Notes")
    ],
    cols: [
      { h: { he: "אשכול", en: "Cluster" }, cell: (r) => <b>{disp(r, "name")}</b> },
      { h: { he: "מחוז", en: "Region" }, cell: (r) => enumLabel("region", r.region) || "—" },
      {
        h: { he: "רשויות", en: "Authorities" },
        cell: (r) => (r.members || []).map((m: string) => nameOf("clients", m)).join(", ") || "—"
      },
      { h: { he: "סוג הסכם", en: "Agreement" }, cell: (r) => enumLabel("clusterScope", r.scope) || "—" },
      {
        h: { he: "הכנסה מצטברת", en: "Rollup revenue" },
        cell: (r) => (
          <Money v={rows("deals")
            .filter((d) => (r.members || []).includes(d.client) && d.stage === "won")
            .reduce((s, d) => s + (Number(d.net) || 0), 0)} />
        )
      },
      {
        h: { he: "עסקים", en: "Businesses" },
        cell: (r) => <Num>{rows("merchants").filter((m) => (r.members || []).includes(m.client)).length}</Num>
      }
    ]
  },

  contacts: {
    group: "g_clients", icon: "☏",
    title: (r) => disp(r, "name"),
    fields: [
      ...nameFields("שם מלא", "Full name"),
      f("mobile", "text", "נייד", "Mobile", { req: true }),
      f("phone", "text", "טלפון", "Phone"),
      f("email", "text", "מייל", "Email"),
      f("channel", "enum", "ערוץ מועדף", "Preferred channel", { e: "interactionType" }),
      f("links", "list", "שיוכים לארגונים", "Organisation links", {
        sub: [
          f("client", "ref", "ארגון", "Organisation", { c: "clients" }),
          f("role", "text", "תפקיד", "Role"),
          f("dm", "bool", "מקבל החלטות", "Decision maker")
        ]
      }),
      f("active", "bool", "פעיל", "Active", { def: true }),
      f("notes", "textarea", "הערות", "Notes")
    ],
    cols: [
      { h: { he: "שם", en: "Name" }, cell: (r) => <b>{disp(r, "name")}</b> },
      {
        h: { he: "ארגון · תפקיד", en: "Organisation · role" },
        cell: (r) =>
          (r.links || []).length
            ? (r.links as Rec[]).map((l, i) => (
                <div key={i}>{nameOf("clients", l.client)}{l.role ? ` — ${l.role}` : ""}</div>
              ))
            : "—"
      },
      { h: { he: "נייד", en: "Mobile" }, cell: (r) => <Num>{r.mobile || "—"}</Num> },
      { h: { he: "מייל", en: "Email" }, cell: (r) => <span className="mono">{r.email || "—"}</span> },
      {
        h: { he: "מקבל החלטות", en: "Decision maker" },
        cell: (r) => ((r.links || []).some((l: Rec) => l.dm) ? <Pill tone="p-acc">✓</Pill> : "—")
      }
    ],
    related: [["interactions", "contactsMulti"], ["quotes", "contact"]]
  },

  deals: {
    group: "g_sales", icon: "◈",
    title: (r) => disp(r, "title"),
    fields: [
      f("titleHe", "text", "שם העסקה", "Deal name", { req: true }),
      f("titleEn", "text", "שם באנגלית", "Name (English)"),
      f("client", "ref", "לקוח", "Client", { c: "clients", req: true }),
      f("type", "enum", "סוג עסקה", "Deal type", { e: "dealType", def: "voucher" }),
      f("stage", "enum", "שלב", "Stage", { e: "stage", req: true, def: "lead" }),
      f("source", "enum", "מקור", "Source", { e: "source" }),
      f("partner", "ref", "שותף מפנה", "Referring partner", { c: "partners" }),
      f("net", "money", "סכום לפני מע״מ", "Amount (net)"),
      f("commissionPct", "pct", "אחוז עמלה", "Commission %"),
      f("terms", "enum", "תנאי תשלום", "Payment terms", { e: "terms" }),
      f("expected", "date", "סגירה צפויה", "Expected close"),
      f("stageSince", "date", "בשלב הנוכחי מאז", "In current stage since"),
      f("verbal", "date", "אישור בעל פה", "Verbal approval"),
      f("po", "date", "קבלת הזמנה / חוזה", "PO / contract received"),
      f("owner", "ref", "מנהל תיק", "Owner", { c: "users" }),
      f("next", "text", "הפעולה הבאה", "Next action"),
      f("nextDate", "date", "מועד הפעולה הבאה", "Next action date"),
      f("lossReason", "text", "סיבת אובדן", "Loss reason"),
      f("notes", "textarea", "הערות", "Notes")
    ],
    cols: [
      { h: { he: "עסקה", en: "Deal" }, cell: (r) => <b>{disp(r, "title")}</b> },
      { h: { he: "לקוח", en: "Client" }, cell: (r) => <Ref coll="clients" id={r.client} /> },
      { h: { he: "שלב", en: "Stage" }, cell: (r) => <Pill group="stage" value={r.stage} /> },
      { h: { he: "סכום", en: "Amount" }, cell: (r) => <Money v={r.net} /> },
      {
        h: { he: "ימים בשלב", en: "Days in stage" },
        cell: (r) => {
          const d = daysAgo(r.stageSince);
          if (d == null) return "—";
          return isStuck(r) ? <Pill tone="p-dan">{d}</Pill> : <Num>{d}</Num>;
        }
      },
      {
        h: { he: "פער בע״פ", en: "Verbal gap" },
        cell: (r) => {
          const g = gapDays(r);
          if (g == null) return "—";
          const s = getSettings();
          return <Pill tone={g <= s.gapOk ? "p-ok" : g <= s.gapWarn ? "p-warn" : "p-dan"}>{g}</Pill>;
        }
      },
      { h: { he: "סגירה צפויה", en: "Expected" }, cell: (r) => <DateText v={r.expected} /> },
      { h: { he: "מנהל תיק", en: "Owner" }, cell: (r) => <Ref coll="users" id={r.owner} /> }
    ],
    related: [["quotes", "deal"], ["contracts", "deal"], ["interactions", "deal"], ["tasks", "deal"], ["campaigns", "deal"]],
    meta: (r) => (
      <>
        <Pill group="stage" value={r.stage} />
        {isStuck(r) ? <Pill tone="p-dan">{t("bottleneck")}</Pill> : null}
        <span className="hint">{nameOf("clients", r.client)}</span>
      </>
    ),
    beforeSave: (next, prev) => {
      if (!prev || prev.stage !== next.stage) next.stageSince = new Date().toISOString().slice(0, 10);
      if (!next.stageSince) next.stageSince = new Date().toISOString().slice(0, 10);
    }
  },

  tenders: {
    group: "g_sales", icon: "◆",
    title: (r) => `${r.num || ""} ${disp(r, "title")}`.trim(),
    fields: [
      f("num", "text", "מספר מכרז", "Tender number", { req: true }),
      f("client", "ref", "רשות", "Authority", { c: "clients", req: true }),
      f("titleHe", "text", "נושא", "Subject"),
      f("titleEn", "text", "נושא באנגלית", "Subject (English)"),
      f("status", "enum", "סטטוס", "Status", { e: "tenderStatus", def: "spotted" }),
      f("published", "date", "מועד פרסום", "Published"),
      f("questions", "date", "שאלות הבהרה", "Clarification deadline"),
      f("submission", "date", "מועד הגשה", "Submission deadline"),
      f("decision", "date", "מועד הכרעה", "Decision date"),
      f("value", "money", "אומדן שווי", "Estimated value"),
      f("guarantee", "money", "ערבות", "Guarantee"),
      f("guaranteeExpiry", "date", "תוקף ערבות", "Guarantee expiry"),
      f("deal", "ref", "עסקה מקושרת", "Linked deal", { c: "deals" }),
      f("owner", "ref", "אחראי", "Owner", { c: "users" }),
      f("docs", "list", "רשימת מסמכים", "Document checklist", {
        sub: [
          f("n", "text", "מסמך", "Document"),
          f("req", "bool", "חובה", "Required"),
          f("ok", "bool", "הועלה", "Uploaded")
        ]
      }),
      f("notes", "textarea", "הערות", "Notes")
    ],
    cols: [
      {
        h: { he: "מכרז", en: "Tender" },
        cell: (r) => (<><b>{r.num || "—"}</b><div className="hint">{disp(r, "title")}</div></>)
      },
      { h: { he: "רשות", en: "Authority" }, cell: (r) => <Ref coll="clients" id={r.client} /> },
      { h: { he: "סטטוס", en: "Status" }, cell: (r) => <Pill group="tenderStatus" value={r.status} /> },
      {
        h: { he: "מועד הגשה", en: "Submission" },
        cell: (r) => {
          const d = daysTo(r.submission);
          if (["won", "lost"].includes(r.status) || d == null) return <DateText v={r.submission} />;
          return d >= 0 && d <= 7 ? <Pill tone="p-dan">{fmtDate(r.submission)}</Pill> : <DateText v={r.submission} />;
        }
      },
      {
        h: { he: "מסמכים", en: "Documents" },
        cell: (r) => {
          const req = (r.docs || []).filter((d: Rec) => d.req);
          if (!req.length) return "—";
          const ok = req.filter((d: Rec) => d.ok).length;
          return <Pill tone={ok === req.length ? "p-ok" : "p-warn"}>{`${ok}/${req.length}`}</Pill>;
        }
      },
      { h: { he: "אומדן", en: "Value" }, cell: (r) => <Money v={r.value} /> },
      {
        h: { he: "ערבות", en: "Guarantee" },
        cell: (r) => {
          const d = daysTo(r.guaranteeExpiry);
          return d != null && d >= 0 && d <= 30
            ? <Pill tone="p-warn">{fmtDate(r.guaranteeExpiry)}</Pill>
            : <DateText v={r.guaranteeExpiry} />;
        }
      }
    ],
    related: [["tasks", "tender"]]
  },

  quotes: {
    group: "g_sales", icon: "▤",
    title: (r) => `${nameOf("deals", r.deal)} · v${r.ver || 1}`,
    fields: [
      f("deal", "ref", "עסקה", "Deal", { c: "deals", req: true }),
      f("ver", "num", "גרסה", "Version", { def: 1 }),
      f("date", "date", "תאריך", "Date"),
      f("valid", "date", "בתוקף עד", "Valid until"),
      f("status", "enum", "סטטוס", "Status", { e: "quoteStatus", def: "draft" }),
      f("contact", "ref", "נשלחה אל", "Sent to", { c: "contacts" }),
      f("owner", "ref", "אחראי", "Owner", { c: "users" }),
      f("lines", "list", "שורות ההצעה", "Line items", {
        sub: [
          f("d", "text", "תיאור", "Description"),
          f("qty", "num", "כמות", "Qty"),
          f("price", "money", "מחיר יחידה", "Unit price")
        ]
      }),
      f("notes", "textarea", "הערות", "Notes")
    ],
    cols: [
      { h: { he: "עסקה", en: "Deal" }, cell: (r) => <b><Ref coll="deals" id={r.deal} /></b> },
      { h: { he: "גרסה", en: "Version" }, cell: (r) => <Num>{`v${r.ver || 1}`}</Num> },
      { h: { he: "תאריך", en: "Date" }, cell: (r) => <DateText v={r.date} /> },
      { h: { he: "בתוקף עד", en: "Valid until" }, cell: (r) => <DateText v={r.valid} /> },
      { h: { he: "נטו", en: "Net" }, cell: (r) => <Money v={quoteNet(r)} /> },
      { h: { he: "סטטוס", en: "Status" }, cell: (r) => <Pill group="quoteStatus" value={r.status} /> },
      { h: { he: "נשלחה אל", en: "Sent to" }, cell: (r) => <Ref coll="contacts" id={r.contact} /> }
    ]
  },

  contracts: {
    group: "g_money", icon: "▣",
    title: (r) => `${r.po || L({ he: "מסמך", en: "Document" })} · ${nameOf("clients", r.client)}`,
    fields: [
      f("client", "ref", "לקוח", "Client", { c: "clients", req: true }),
      f("deal", "ref", "עסקה", "Deal", { c: "deals" }),
      f("docType", "enum", "סוג מסמך", "Document type", { e: "docType", def: "po" }),
      f("po", "text", "מספר הזמנה", "PO number"),
      f("status", "enum", "סטטוס", "Status", { e: "contractStatus", def: "awaiting" }),
      f("signed", "date", "תאריך חתימה", "Signed on"),
      f("start", "date", "תחילת תקופה", "Start"),
      f("end", "date", "סיום תקופה", "End"),
      f("autoRenew", "bool", "חידוש אוטומטי", "Auto renew"),
      f("noticeDays", "num", "הודעה מוקדמת (ימים)", "Notice period (days)"),
      f("net", "money", "סכום לפני מע״מ", "Amount (net)"),
      f("signatories", "text", "חתומים", "Signatories"),
      f("owner", "ref", "אחראי", "Owner", { c: "users" }),
      f("schedule", "list", "לוח תשלומים", "Payment schedule", {
        sub: [
          f("m", "text", "אבן דרך", "Milestone"),
          f("date", "date", "תאריך", "Date"),
          f("amt", "money", "סכום", "Amount")
        ]
      }),
      f("notes", "textarea", "הערות", "Notes")
    ],
    cols: [
      {
        h: { he: "מסמך", en: "Document" },
        cell: (r) => (<><b>{r.po || "—"}</b><div className="hint">{enumLabel("docType", r.docType)}</div></>)
      },
      { h: { he: "לקוח", en: "Client" }, cell: (r) => <Ref coll="clients" id={r.client} /> },
      { h: { he: "סטטוס", en: "Status" }, cell: (r) => <Pill group="contractStatus" value={r.status} /> },
      { h: { he: "נחתם", en: "Signed" }, cell: (r) => <DateText v={r.signed} /> },
      {
        h: { he: "סיום", en: "Ends" },
        cell: (r) => {
          const d = daysTo(r.end);
          return r.status === "signed" && d != null && d >= 0 && d <= 90
            ? <Pill tone="p-warn">{fmtDate(r.end)}</Pill>
            : <DateText v={r.end} />;
        }
      },
      { h: { he: "סכום", en: "Amount" }, cell: (r) => <Money v={r.net} /> },
      { h: { he: "תשלומים", en: "Payments" }, cell: (r) => <Num>{(r.schedule || []).length}</Num> }
    ],
    related: [["payments", "contract"]]
  },

  payments: {
    group: "g_money", icon: "₪",
    title: (r) => `${nameOf("clients", r.client)} · ${enumLabel("payType", r.type)}`,
    fields: [
      f("client", "ref", "לקוח", "Client", { c: "clients", req: true }),
      f("contract", "ref", "חוזה / הזמנה", "Contract / PO", { c: "contracts" }),
      f("type", "enum", "סוג תשלום", "Payment type", { e: "payType", def: "once" }),
      f("net", "money", "סכום לפני מע״מ", "Amount (net)", { req: true }),
      f("due", "date", "תאריך יעד", "Due date", { req: true }),
      f("status", "enum", "סטטוס", "Status", { e: "payStatus", def: "planned" }),
      f("invoice", "text", "מספר חשבונית", "Invoice number", {
        hint: { he: "EZCount — הזנה ידנית עד לחיבור", en: "EZCount — manual until connected" }
      }),
      f("paidAt", "date", "תאריך תקבול", "Paid on"),
      f("paidAmount", "money", "סכום שהתקבל", "Amount received"),
      f("reminders", "num", "תזכורות שנשלחו", "Reminders sent"),
      f("recurrence", "text", "חזרתיות", "Recurrence"),
      f("notes", "textarea", "הערות", "Notes")
    ],
    cols: [
      { h: { he: "לקוח", en: "Client" }, cell: (r) => <b><Ref coll="clients" id={r.client} /></b> },
      {
        h: { he: "סוג", en: "Type" },
        cell: (r) => (<>{enumLabel("payType", r.type)}{r.recurrence ? <div className="hint">{r.recurrence}</div> : null}</>)
      },
      { h: { he: "נטו", en: "Net" }, cell: (r) => <Money v={r.net} /> },
      { h: { he: "תאריך יעד", en: "Due" }, cell: (r) => <DateText v={r.due} /> },
      { h: { he: "סטטוס", en: "Status" }, cell: (r) => <Pill group="payStatus" value={payStatus(r)} /> },
      {
        h: { he: "פיגור", en: "Overdue" },
        cell: (r) => {
          const d = overdue(r);
          return d > 0 ? <Pill tone={d > 60 ? "p-dan" : "p-warn"}>{d}</Pill> : "—";
        }
      },
      {
        h: { he: "תזכורות", en: "Reminders" },
        cell: (r) => {
          const n = Number(r.reminders) || 0;
          return n >= getSettings().debtAfter ? <Pill tone="p-dan">{n}</Pill> : <Num>{n}</Num>;
        }
      },
      { h: { he: "חשבונית", en: "Invoice" }, cell: (r) => (r.invoice ? <span className="mono">{r.invoice}</span> : "—") }
    ]
  },

  campaigns: {
    group: "g_impact", icon: "◎",
    title: (r) => disp(r, "name"),
    fields: [
      ...nameFields("שם הקמפיין", "Campaign name"),
      f("client", "ref", "לקוח", "Client", { c: "clients" }),
      f("deal", "ref", "עסקה", "Deal", { c: "deals" }),
      f("type", "enum", "סוג קמפיין", "Campaign type", { e: "campaignType", def: "voucher" }),
      f("status", "enum", "סטטוס", "Status", { e: "campaignStatus", def: "prep" }),
      f("metric", "enum", "מדד היעד", "Goal metric", { e: "goalMetric", def: "redemptions" }),
      f("goal", "num", "ערך היעד", "Goal value"),
      f("currentValue", "num", "ערך נוכחי", "Current value"),
      f("budget", "money", "תקציב", "Budget"),
      f("cost", "money", "עלות בפועל", "Actual cost"),
      f("start", "date", "התחלה", "Start"),
      f("end", "date", "סיום", "End"),
      f("scope", "refs", "רשויות / אתרים פעילים", "Active authorities / sites", { c: "clients" }),
      f("owner", "ref", "אחראי", "Owner", { c: "users" }),
      f("notes", "textarea", "הערות", "Notes")
    ],
    cols: [
      {
        h: { he: "קמפיין", en: "Campaign" },
        cell: (r) => (<><b>{disp(r, "name")}</b><div className="hint">{nameOf("clients", r.client)}</div></>)
      },
      { h: { he: "סטטוס", en: "Status" }, cell: (r) => <Pill group="campaignStatus" value={r.status} /> },
      { h: { he: "מדד", en: "Metric" }, cell: (r) => enumLabel("goalMetric", r.metric) },
      { h: { he: "יעד", en: "Goal" }, cell: (r) => <Num>{`${fmtN(r.currentValue)} / ${fmtN(r.goal)}`}</Num> },
      {
        h: { he: "התקדמות", en: "Progress" },
        cell: (r) => {
          const p = progressOf(r);
          return (<><Meter pct={p} width={64} /> <Num>{`${Math.round(p)}%`}</Num></>);
        }
      },
      {
        h: { he: "קצב מול זמן", en: "Pace" },
        cell: (r) => {
          const p = paceOf(r);
          return p == null ? "—" : <Pill tone={p < 0.7 ? "p-dan" : p < 0.95 ? "p-warn" : "p-ok"}>{p.toFixed(2)}</Pill>;
        }
      },
      { h: { he: "תקופה", en: "Period" }, cell: (r) => <Num>{`${fmtDate(r.start)} – ${fmtDate(r.end)}`}</Num> }
    ],
    related: [["batches", "campaign"], ["events", "campaign"], ["redemptions", "campaign"]]
  },

  batches: {
    group: "g_impact", icon: "▨",
    title: (r) => `${nameOf("campaigns", r.campaign)} · ${fmtN(r.issued)}×₪${fmtN(r.face)}`,
    fields: [
      f("campaign", "ref", "קמפיין", "Campaign", { c: "campaigns", req: true }),
      f("issued", "num", "כמות שהונפקה", "Quantity issued"),
      f("face", "money", "ערך נקוב ליחידה", "Face value"),
      f("cost", "money", "עלות למטגו", "Cost to Metgo"),
      f("issueDate", "date", "תאריך הנפקה", "Issue date"),
      f("expiry", "date", "תאריך פקיעה", "Expiry date"),
      f("cIssued", "num", "פתוחים (טרם הופעלו)", "Open (not activated)"),
      f("cActive", "num", "פעילים", "Active"),
      f("cPartial", "num", "מומשו חלקית", "Partly redeemed"),
      f("cRedeemed", "num", "מומשו", "Redeemed"),
      f("cExpired", "num", "פגי תוקף", "Expired")
    ],
    cols: [
      { h: { he: "קמפיין", en: "Campaign" }, cell: (r) => <b><Ref coll="campaigns" id={r.campaign} /></b> },
      { h: { he: "הונפקו", en: "Issued" }, cell: (r) => <Num>{fmtN(r.issued)}</Num> },
      { h: { he: "ערך נקוב", en: "Face" }, cell: (r) => <Money v={r.face} /> },
      { h: { he: "שווי כולל", en: "Total face" }, cell: (r) => <Money v={(Number(r.issued) || 0) * (Number(r.face) || 0)} /> },
      {
        h: { he: "פקיעה", en: "Expiry" },
        cell: (r) => {
          const d = daysTo(r.expiry);
          return d != null && d >= 0 && d <= 30 && redeemedPct(r) < 70
            ? <Pill tone="p-dan">{fmtDate(r.expiry)}</Pill>
            : <DateText v={r.expiry} />;
        }
      },
      {
        h: { he: "אחוז מימוש", en: "Redeemed %" },
        cell: (r) => {
          const p = redeemedPct(r);
          return (<><Meter pct={p} width={64} /> <Num>{`${p}%`}</Num></>);
        }
      }
    ]
  },

  merchants: {
    group: "g_impact", icon: "⌂",
    title: (r) => disp(r, "name"),
    fields: [
      ...nameFields("שם העסק", "Business name"),
      f("bn", "text", "ח.פ. / ע.מ.", "Business number"),
      f("cat", "enum", "קטגוריה", "Category", { e: "merchantCat" }),
      f("client", "ref", "רשות", "Authority", { c: "clients" }),
      f("status", "enum", "סטטוס", "Status", { e: "merchantStatus", def: "candidate" }),
      f("joined", "date", "תאריך הצטרפות", "Joined on"),
      f("address", "text", "כתובת", "Address"),
      f("phone", "text", "טלפון", "Phone"),
      f("ownerName", "text", "בעל העסק", "Owner name"),
      f("redemptions", "num", "מספר מימושים", "Redemption count"),
      f("revenue", "money", "הכנסה מהמערכת", "Revenue via the system"),
      f("last", "date", "מימוש אחרון", "Last redemption"),
      f("notes", "textarea", "הערות", "Notes")
    ],
    cols: [
      {
        h: { he: "עסק", en: "Business" },
        cell: (r) => (<><b>{disp(r, "name")}</b>{r.bn ? <div className="hint mono">{r.bn}</div> : null}</>)
      },
      { h: { he: "קטגוריה", en: "Category" }, cell: (r) => enumLabel("merchantCat", r.cat) || "—" },
      { h: { he: "רשות", en: "Authority" }, cell: (r) => <Ref coll="clients" id={r.client} /> },
      { h: { he: "סטטוס", en: "Status" }, cell: (r) => <Pill group="merchantStatus" value={r.status} /> },
      { h: { he: "הצטרף", en: "Joined" }, cell: (r) => <DateText v={r.joined} /> },
      { h: { he: "מימושים", en: "Redemptions" }, cell: (r) => <Num>{fmtN(r.redemptions)}</Num> },
      { h: { he: "הכנסה", en: "Revenue" }, cell: (r) => <Money v={r.revenue} /> },
      {
        h: { he: "מימוש אחרון", en: "Last" },
        cell: (r) => {
          const d = daysAgo(r.last);
          if (d == null) return "—";
          return d > 60 ? <Pill tone="p-warn">{dayWord(d)}</Pill> : <Num>{dayWord(d)}</Num>;
        }
      }
    ],
    related: [["redemptions", "merchant"]]
  },

  redemptions: {
    group: "g_impact", icon: "⇄",
    title: (r) => `${nameOf("merchants", r.merchant)} · ₪${fmtN(r.amount)}`,
    fields: [
      f("merchant", "ref", "עסק", "Business", { c: "merchants", req: true }),
      f("channel", "enum", "ערוץ", "Channel", { e: "channel", def: "offline" }),
      f("amount", "money", "סכום", "Amount", { req: true }),
      f("date", "date", "תאריך", "Date"),
      f("campaign", "ref", "קמפיין", "Campaign", { c: "campaigns" }),
      f("source", "enum", "מקור הנתון", "Data source", { e: "dataSource", def: "manual" }),
      f("externalRef", "text", "מזהה חיצוני", "External reference")
    ],
    cols: [
      { h: { he: "עסק", en: "Business" }, cell: (r) => <b><Ref coll="merchants" id={r.merchant} /></b> },
      { h: { he: "ערוץ", en: "Channel" }, cell: (r) => <Pill group="channel" value={r.channel} /> },
      { h: { he: "סכום", en: "Amount" }, cell: (r) => <Money v={r.amount} /> },
      { h: { he: "תאריך", en: "Date" }, cell: (r) => <DateText v={r.date} /> },
      { h: { he: "קמפיין", en: "Campaign" }, cell: (r) => <Ref coll="campaigns" id={r.campaign} /> },
      { h: { he: "מקור", en: "Source" }, cell: (r) => <Pill group="dataSource" value={r.source} /> }
    ],
    sort: (a, b) => String(b.date || "").localeCompare(String(a.date || ""))
  },

  partners: {
    group: "g_system", icon: "⚯",
    title: (r) => disp(r, "name"),
    fields: [
      ...nameFields("שם השותף", "Partner name"),
      f("type", "enum", "סוג", "Type", { e: "partnerType", def: "agent" }),
      f("contact", "text", "איש קשר", "Contact person"),
      f("mobile", "text", "נייד", "Mobile"),
      f("email", "text", "מייל", "Email"),
      f("areas", "text", "תחומי פעילות", "Activity areas"),
      f("model", "text", "מודל עמלה", "Commission model"),
      f("pct", "pct", "אחוז עמלה", "Commission %"),
      f("accrued", "money", "עמלות שנצברו", "Accrued commission"),
      f("paid", "money", "עמלות ששולמו", "Paid commission"),
      f("cadence", "num", "תדירות דיווח (ימים)", "Report cadence (days)", { def: 14 }),
      f("lastReport", "date", "דיווח אחרון", "Last report"),
      f("status", "enum", "סטטוס", "Status", { e: "activeStatus", def: "active" }),
      f("notes", "textarea", "הערות", "Notes")
    ],
    cols: [
      {
        h: { he: "שותף", en: "Partner" },
        cell: (r) => (<><b>{disp(r, "name")}</b>{r.contact ? <div className="hint">{r.contact}</div> : null}</>)
      },
      { h: { he: "סוג", en: "Type" }, cell: (r) => enumLabel("partnerType", r.type) },
      { h: { he: "תחומים", en: "Areas" }, cell: (r) => r.areas || "—" },
      { h: { he: "עמלה", en: "Commission" }, cell: (r) => (<>{r.model || "—"}{r.pct ? <> · <Num>{`${r.pct}%`}</Num></> : null}</>) },
      { h: { he: "נצבר", en: "Accrued" }, cell: (r) => <Money v={r.accrued} /> },
      { h: { he: "שולם", en: "Paid" }, cell: (r) => <Money v={r.paid} /> },
      {
        h: { he: "דיווח הבא", en: "Next report" },
        cell: (r) => {
          const n = nextReport(r);
          if (!n) return "—";
          const d = daysTo(n);
          return d != null && d < 0 ? <Pill tone="p-warn">{fmtDate(n)}</Pill> : <DateText v={n} />;
        }
      }
    ],
    related: [["deals", "partner"]]
  },

  interactions: {
    group: "g_work", icon: "◷",
    title: (r) => `${enumLabel("interactionType", r.type)} · ${nameOf("clients", r.client)}`,
    fields: [
      f("type", "enum", "סוג", "Type", { e: "interactionType", def: "meeting" }),
      f("client", "ref", "לקוח", "Client", { c: "clients", req: true }),
      f("deal", "ref", "עסקה", "Deal", { c: "deals" }),
      f("contacts", "refs", "אנשי קשר", "Contacts", { c: "contacts" }),
      f("date", "date", "תאריך", "Date", { req: true }),
      f("dur", "num", "משך (דקות)", "Duration (min)"),
      f("owner", "ref", "מהצוות", "Our side", { c: "users" }),
      f("source", "enum", "מקור", "Source", { e: "dataSource", def: "manual" }),
      f("documented", "bool", "תועד", "Documented"),
      f("summary", "textarea", "סיכום", "Summary"),
      f("decisions", "textarea", "החלטות והמשך", "Decisions & next steps")
    ],
    cols: [
      { h: { he: "תאריך", en: "Date" }, cell: (r) => <DateText v={r.date} /> },
      { h: { he: "סוג", en: "Type" }, cell: (r) => enumLabel("interactionType", r.type) },
      { h: { he: "לקוח", en: "Client" }, cell: (r) => <b><Ref coll="clients" id={r.client} /></b> },
      {
        h: { he: "אנשי קשר", en: "Contacts" },
        cell: (r) => (r.contacts || []).map((c: string) => nameOf("contacts", c)).join(", ") || "—"
      },
      { h: { he: "משך", en: "Duration" }, cell: (r) => (r.dur ? <Num>{r.dur}</Num> : "—") },
      { h: { he: "מקור", en: "Source" }, cell: (r) => <Pill group="dataSource" value={r.source} /> },
      {
        h: { he: "תועד", en: "Documented" },
        cell: (r) => (r.documented ? <Pill tone="p-ok">✓</Pill> : <Pill tone="p-dan">{L({ he: "חסר", en: "Missing" })}</Pill>)
      }
    ],
    sort: (a, b) => String(b.date || "").localeCompare(String(a.date || ""))
  },

  tasks: {
    group: "g_work", icon: "✓",
    title: (r) => disp(r, "title"),
    fields: [
      f("titleHe", "text", "המשימה", "Task", { req: true }),
      f("titleEn", "text", "באנגלית", "In English"),
      f("domain", "enum", "תחום", "Domain", { e: "taskDomain", def: "sales" }),
      f("client", "ref", "לקוח", "Client", { c: "clients" }),
      f("deal", "ref", "עסקה", "Deal", { c: "deals" }),
      f("tender", "ref", "מכרז", "Tender", { c: "tenders" }),
      f("assignee", "ref", "אחראי", "Assignee", { c: "users" }),
      f("priority", "enum", "עדיפות", "Priority", { e: "priority", def: "med" }),
      f("due", "date", "תאריך יעד", "Due date", { req: true }),
      f("status", "enum", "סטטוס", "Status", { e: "taskStatus", def: "todo" }),
      f("src", "enum", "מקור", "Source", { e: "taskSrc", def: "manual" }),
      f("notes", "textarea", "פירוט", "Details")
    ],
    cols: [
      { h: { he: "משימה", en: "Task" }, cell: (r) => <b>{disp(r, "title")}</b> },
      { h: { he: "תחום", en: "Domain" }, cell: (r) => enumLabel("taskDomain", r.domain) },
      {
        h: { he: "לקוח", en: "Client" },
        cell: (r) => (r.client ? <Ref coll="clients" id={r.client} /> : <span className="hint">{t("general")}</span>)
      },
      { h: { he: "אחראי", en: "Assignee" }, cell: (r) => <Ref coll="users" id={r.assignee} /> },
      { h: { he: "עדיפות", en: "Priority" }, cell: (r) => <Pill group="priority" value={r.priority} /> },
      {
        h: { he: "יעד", en: "Due" },
        cell: (r) => {
          if (r.status === "done") return <DateText v={r.due} />;
          const d = daysAgo(r.due);
          if (d == null) return "—";
          if (d > 0) return <Pill tone="p-dan">{fmtDate(r.due)}</Pill>;
          if (d === 0) return <Pill tone="p-warn">{t("today")}</Pill>;
          return <DateText v={r.due} />;
        }
      },
      { h: { he: "סטטוס", en: "Status" }, cell: (r) => <Pill group="taskStatus" value={r.status} /> },
      { h: { he: "מקור", en: "Source" }, cell: (r) => <Pill group="taskSrc" value={r.src} /> }
    ],
    sort: (a, b) => String(a.due || "9999").localeCompare(String(b.due || "9999"))
  },

  events: {
    group: "g_work", icon: "★",
    title: (r) => disp(r, "name"),
    fields: [
      ...nameFields("שם האירוע", "Event name"),
      f("type", "enum", "סוג", "Type", { e: "eventType", def: "fair" }),
      f("client", "ref", "לקוח", "Client", { c: "clients" }),
      f("campaign", "ref", "קמפיין", "Campaign", { c: "campaigns" }),
      f("date", "date", "תאריך", "Date"),
      f("location", "text", "מיקום", "Location"),
      f("est", "num", "משתתפים צפוי", "Attendees (est.)"),
      f("actual", "num", "משתתפים בפועל", "Attendees (actual)"),
      f("merchants", "refs", "עסקים משתתפים", "Participating businesses", { c: "merchants" }),
      f("budget", "money", "תקציב", "Budget"),
      f("cost", "money", "עלות", "Cost"),
      f("owner", "ref", "אחראי", "Owner", { c: "users" }),
      f("status", "enum", "סטטוס", "Status", { e: "eventStatus", def: "prep" }),
      f("goals", "textarea", "מטרות", "Objectives"),
      f("summary", "textarea", "סיכום ולקחים", "Summary & lessons")
    ],
    cols: [
      {
        h: { he: "אירוע", en: "Event" },
        cell: (r) => (<><b>{disp(r, "name")}</b><div className="hint">{enumLabel("eventType", r.type)}</div></>)
      },
      { h: { he: "לקוח", en: "Client" }, cell: (r) => <Ref coll="clients" id={r.client} /> },
      { h: { he: "תאריך", en: "Date" }, cell: (r) => <DateText v={r.date} /> },
      { h: { he: "מיקום", en: "Location" }, cell: (r) => r.location || "—" },
      {
        h: { he: "משתתפים", en: "Attendees" },
        cell: (r) => (r.actual ? <Num>{fmtN(r.actual)}</Num> : <span className="hint num">{fmtN(r.est)}</span>)
      },
      { h: { he: "עסקים", en: "Businesses" }, cell: (r) => <Num>{(r.merchants || []).length}</Num> },
      { h: { he: "תקציב / עלות", en: "Budget / cost" }, cell: (r) => (<><Money v={r.budget} /> / <Money v={r.cost} /></>) }
    ]
  },

  automations: {
    group: "g_system", icon: "⚡",
    title: (r) => `#${r.n} ${L(r.trig || { he: "", en: "" })}`,
    fields: [f("n", "num", "מספר", "Number"), f("on", "bool", "מופעל", "Enabled")],
    cols: [{ h: { he: "חוק", en: "Rule" }, cell: (r) => <b>{L(r.trig || { he: "", en: "" })}</b> }]
  },

  settings: {
    group: "g_system", icon: "⚙",
    title: () => t("settings"),
    fields: [],
    cols: []
  }
};

export const collectionsInNav: CollName[] = [
  "deals", "tenders", "quotes", "clients", "clusters", "contacts",
  "contracts", "payments", "campaigns", "merchants", "redemptions",
  "tasks", "interactions", "events", "partners", "users"
];
