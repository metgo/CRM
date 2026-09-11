"use client";

import { rows } from "@/lib/mc/store";
import { L, t } from "@/lib/mc/i18n";
import { fmtN, ils } from "@/lib/mc/format";
import { aggregates } from "@/lib/mc/compute";
import { Kpi, Section } from "../ui";

const TEMPLATES = [
  {
    n: { he: "עדכון דירקטוריון", en: "Board update" },
    f: { he: "רבעוני", en: "Quarterly" },
    c: { he: "הכנסות מול יעד, צנרת, אימפקט, תווים, סיכונים", en: "Revenue vs target, pipeline, impact, vouchers, risks" }
  },
  {
    n: { he: "עדכון תקופתי", en: "Periodic update" },
    f: { he: "חודשי", en: "Monthly" },
    c: { he: "מה נסגר, מה נכנס לצנרת, גבייה, משימות פתוחות", en: "Closed, pipeline, collections, open tasks" }
  },
  {
    n: { he: "דוח אימפקט", en: "Impact report" },
    f: { he: "רבעוני", en: "Quarterly" },
    c: { he: "כסף לעסקים, עסקים חדשים, פילוח קטגוריות, אירועים", en: "Money to businesses, new businesses, categories, events" }
  },
  {
    n: { he: "דיווח לשותף", en: "Partner report" },
    f: { he: "כל 14 יום", en: "Every 14 days" },
    c: { he: "עסקאות פתוחות ועמלות — נתוני השותף בלבד", en: "Open deals and commission — that partner's data only" }
  },
  {
    n: { he: "דוח גבייה", en: "Collections report" },
    f: { he: "שבועי", en: "Weekly" },
    c: { he: "גיול חובות, תזכורות שיצאו, חובות פתוחים", en: "Aging, reminders sent, open debts" }
  }
];

export function Reports() {
  const a = aggregates();
  return (
    <>
      <Section title={t("snapshot")} />
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(186px,1fr))" }}>
        <Kpi label={L({ he: "הכנסה מוכרת", en: "Recognised revenue" })} value={ils(a.collected)} />
        <Kpi label={L({ he: "צנרת משוקללת", en: "Weighted pipeline" })} value={ils(a.weighted)} />
        <Kpi label={L({ he: "כסף לעסקים", en: "Money to businesses" })} value={ils(a.toBusinesses)} />
        <Kpi
          label={L({ he: "עסקים פעילים", en: "Active businesses" })}
          value={fmtN(rows("merchants").filter((m) => m.status === "active").length)}
        />
      </div>

      <Section title={t("reportTemplates")} />
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        {TEMPLATES.map((r) => (
          <div className="card" key={r.n.en} style={{ padding: "15px 17px" }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3 }}>{L(r.n)}</div>
            <div className="hint" style={{ marginBottom: 9 }}>{L(r.f)}</div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{L(r.c)}</div>
          </div>
        ))}
      </div>

      <div className="note" style={{ marginTop: 16 }}>
        {L({
          he: "כל דוח בנוי מתבנית + טווח תאריכים + מסנן היקף. הפקה ושליחה אוטומטית דורשות עבודת שרת — ראו README.",
          en: "Every report is a template + date range + scope filter. Generating and sending them on a schedule needs a server job — see the README."
        })}
      </div>
    </>
  );
}
