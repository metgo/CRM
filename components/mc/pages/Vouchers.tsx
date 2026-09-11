"use client";

import { rows, type CollName } from "@/lib/mc/store";
import { SCHEMA } from "@/lib/mc/schema";
import { L, t } from "@/lib/mc/i18n";
import { fmtN, ils } from "@/lib/mc/format";
import { aggregates } from "@/lib/mc/compute";
import { DataTable } from "../DataTable";
import { EmptyState, Kpi, Section } from "../ui";

export function Vouchers({
  onOpen
}: { onOpen: (target: { coll: CollName; id: string | null }) => void }) {
  const a = aggregates();
  const c = a.voucherCounts;
  const total = Object.values(c).reduce((x, y) => x + y, 0);
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : "—");

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))" }}>
        <Kpi label={t("open")} value={fmtN(c.cIssued || 0)} note={L({ he: "הונפקו וטרם הופעלו", en: "issued, not activated" })} />
        <Kpi label={t("active")} value={fmtN(c.cActive || 0)} note={L({ he: "בתוקף עם יתרה", en: "valid with balance" })} />
        <Kpi label={t("partly")} value={fmtN(c.cPartial || 0)} />
        <Kpi label={t("redeemed")} value={fmtN(c.cRedeemed || 0)} note={pct(c.cRedeemed || 0)} />
        <Kpi label={t("expired")} value={fmtN(c.cExpired || 0)} note={pct(c.cExpired || 0)} />
        <Kpi label={t("liability")} value={ils(a.openLiability)} />
      </div>

      <Section
        title={L({ he: "מנות הנפקה", en: "Issue batches" })}
        action={<button className="tbtn pri" onClick={() => onOpen({ coll: "batches", id: null })}>+ {t("addRecord")}</button>}
      />
      {rows("batches").length ? (
        <DataTable cols={SCHEMA.batches.cols} data={rows("batches")} onOpen={(r) => onOpen({ coll: "batches", id: r.id })} />
      ) : (
        <EmptyState onAdd={() => onOpen({ coll: "batches", id: null })} />
      )}

      <div className="note" style={{ marginTop: 14 }}>
        {L({
          he: "תו „פתוח” הונפק וטרם הופעל על ידי התושב; תו „פעיל” הופעל, בתוקף, עם יתרה. עד לחיבור מערכת התווים הנתונים מוזנים ידנית או בייבוא.",
          en: "An “open” voucher was issued but not yet activated; an “active” one is activated, valid, with balance. Until the voucher platform is connected these figures are entered manually or imported."
        })}
      </div>
    </>
  );
}
