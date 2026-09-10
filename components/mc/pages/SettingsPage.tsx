"use client";

import { useState } from "react";
import { COLLECTIONS, getSettings, rows, save, type CollName } from "@/lib/mc/store";
import { SCHEMA } from "@/lib/mc/schema";
import { L, t } from "@/lib/mc/i18n";
import { DataTable } from "../DataTable";
import { EmptyState, Section } from "../ui";

const NUMERIC_SETTINGS: Array<[keyof ReturnType<typeof getSettings>, { he: string; en: string }, string]> = [
  ["vat", { he: "שיעור מע״מ", en: "VAT rate" }, "%"],
  ["targetYear", { he: "יעד הכנסות שנתי", en: "Annual revenue target" }, "₪"],
  ["slaLead", { he: "SLA — ליד", en: "SLA — lead" }, "d"],
  ["slaMeeting", { he: "SLA — פגישה ראשונה", en: "SLA — first meeting" }, "d"],
  ["slaQuote", { he: "SLA — הצעת מחיר", en: "SLA — quote" }, "d"],
  ["slaVerbal", { he: "SLA — סגירה בע״פ", en: "SLA — verbal close" }, "d"],
  ["slaPo", { he: "SLA — הזמנה / חוזה", en: "SLA — PO / contract" }, "d"],
  ["gapOk", { he: "פער בע״פ תקין עד", en: "Verbal gap acceptable up to" }, "d"],
  ["gapWarn", { he: "פער בע״פ באזהרה עד", en: "Verbal gap warning up to" }, "d"],
  ["debtAfter", { he: "סימון חוב פתוח אחרי", en: "Flag open debt after" }, "×"]
];

export function SettingsPage({
  onOpen, onToast
}: { onOpen: (t: { coll: CollName; id: string | null }) => void; onToast: (m: string) => void }) {
  const [draft, setDraft] = useState<Record<string, number>>({ ...(getSettings() as any) });
  const [busy, setBusy] = useState(false);

  const saveSettings = async () => {
    setBusy(true);
    try {
      await save("settings", "main", draft);
      onToast(t("saved"));
    } catch (e) {
      onToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Section title={t("parameters")} />
      <div className="card" style={{ padding: "14px 18px" }}>
        <div className="fl">
          {NUMERIC_SETTINGS.map(([key, label, unit]) => (
            <div key={String(key)} style={{ display: "contents" }}>
              <div className="k">{L(label)}</div>
              <div className="v">
                <input
                  type="number"
                  value={draft[key as string] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [key as string]: Number(e.target.value) })}
                  style={{
                    width: 120, background: "var(--surface)", border: "1px solid var(--line)",
                    borderRadius: 6, padding: "4px 8px"
                  }}
                />{" "}
                <span className="hint">{unit === "d" ? t("days") : unit}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="tbtn pri" onClick={saveSettings} disabled={busy}>{t("save")}</button>
        </div>
      </div>

      <Section
        title={t("users")}
        action={<button className="tbtn pri" onClick={() => onOpen({ coll: "users", id: null })}>+ {t("addRecord")}</button>}
      />
      {rows("users").length ? (
        <DataTable cols={SCHEMA.users.cols} data={rows("users")} onOpen={(r) => onOpen({ coll: "users", id: r.id })} />
      ) : (
        <EmptyState onAdd={() => onOpen({ coll: "users", id: null })} />
      )}

      <Section title={t("dataCounts")} />
      <div className="card" style={{ padding: "15px 18px" }}>
        <div className="fl">
          {COLLECTIONS.filter((c) => c !== "settings" && c !== "automations").map((c) => (
            <div key={c} style={{ display: "contents" }}>
              <div className="k">{t(c)}</div>
              <div className="v"><span className="num">{rows(c).length}</span></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
