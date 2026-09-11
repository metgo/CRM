"use client";

import { rows, save, type CollName } from "@/lib/mc/store";
import { SCHEMA } from "@/lib/mc/schema";
import { E } from "@/lib/mc/enums";
import { L, t } from "@/lib/mc/i18n";
import { fmtN, ils } from "@/lib/mc/format";
import { aggregates, overdue, paceOf, progressOf } from "@/lib/mc/compute";
import { buildAlerts } from "@/lib/mc/alerts";
import { Kpi, Meter, Pill, Section } from "../ui";

type Open = (target: { coll: CollName; id: string | null }) => void;

const AGING: Array<[{ he: string; en: string }, number, number]> = [
  [{ he: "0–30", en: "0–30" }, 1, 30],
  [{ he: "31–60", en: "31–60" }, 31, 60],
  [{ he: "61–90", en: "61–90" }, 61, 90],
  [{ he: "90+", en: "90+" }, 91, 99999]
];

export function Dashboard({ onOpen, onToast }: { onOpen: Open; onToast: (m: string) => void }) {
  const a = aggregates();
  const alerts = buildAlerts();
  const anyData = (["clients", "deals", "payments", "merchants", "tasks"] as CollName[]).some((c) => rows(c).length);

  if (!anyData) {
    return (
      <div className="tablewrap">
        <div className="empty">
          <b>{L({ he: "המערכת ריקה", en: "The system is empty" })}</b>
          {L({ he: "התחילו מהוספת לקוח או עסקה — הדשבורד יתמלא מעצמו.", en: "Start by adding a client or a deal — the dashboard fills itself." })}
          <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="tbtn pri" onClick={() => onOpen({ coll: "clients", id: null })}>+ {t("clients")}</button>
            <button className="tbtn" onClick={() => onOpen({ coll: "deals", id: null })}>+ {t("deals")}</button>
            <button className="tbtn" onClick={() => onOpen({ coll: "users", id: null })}>+ {t("users")}</button>
          </div>
        </div>
      </div>
    );
  }

  const funnel = ["lead", "meeting", "quote", "verbal", "po"].map((st) => {
    const list = rows("deals").filter((d) => d.stage === st);
    return { st, n: list.length, amt: list.reduce((s, d) => s + (Number(d.net) || 0), 0) };
  });
  const maxF = Math.max(...funnel.map((f) => f.amt), 1);

  const createTask = async (task: any) => {
    try {
      await save("tasks", null, { status: "todo", src: "automation", ...task });
      onToast(t("taskCreated"));
    } catch (e) {
      onToast((e as Error).message);
    }
  };

  return (
    <>
      <Section title={t("alerts")} sub={`${alerts.length}`} />
      {alerts.length ? (
        <div className="card alist">
          {alerts.slice(0, 10).map((x, i) => (
            <div className="arow" key={i} onClick={() => onOpen({ coll: x.target.coll, id: x.target.id })}>
              <span
                className="dot"
                style={{ background: x.severity >= 3 ? "var(--danger)" : x.severity === 2 ? "var(--warn)" : "var(--info)" }}
              />
              <span className="txt">
                <span className="t1">{x.title}</span>
                <span className="t2">{x.detail}</span>
              </span>
              {x.task ? (
                <span className="meta">
                  <span
                    className="tbtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      void createTask(x.task);
                    }}
                  >
                    {t("createTask")}
                  </span>
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="tablewrap"><div className="empty">{t("noAlerts")}</div></div>
      )}

      <Section title={t("money")} />
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))" }}>
        <Kpi
          label={t("openDebt")}
          value={ils(a.openDebt)}
          note={
            <>
              {a.debtClients ? <Pill tone="p-dan">{`${a.debtClients} ${t("clients_count")}`}</Pill> : null}
              {a.debtOver60 ? <span>{`${t("over60")}: ${ils(a.debtOver60)}`}</span> : null}
            </>
          }
        />
        <Kpi label={t("collected")} value={ils(a.collected)} note={<span>{`${L({ he: "פתוח לגבייה", en: "open" })}: ${ils(a.committed)}`}</span>} />
        <Kpi
          label={t("forecast")}
          value={ils(a.forecast)}
          note={a.target ? <span className="num">{`${Math.round((a.forecast / a.target) * 100)}% ${t("ofTarget")}`}</span> : null}
        />
        <Kpi label={t("commission")} value={ils(a.commission)} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", marginTop: 12 }}>
        <div className="card" style={{ padding: "15px 17px" }}>
          <div className="hint" style={{ marginBottom: 10 }}>{t("forecast")}</div>
          {([[t("committed"), a.collected + a.committed, "var(--accent)"], [t("weighted"), a.weighted, "var(--info)"]] as const).map(
            ([label, value, color]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 74, fontSize: 12.5, color: "var(--muted)" }}>{label}</span>
                <span className="meter" style={{ flex: 1 }}>
                  <i style={{ width: `${a.target ? Math.min(100, (value / a.target) * 100) : 0}%`, background: color }} />
                </span>
                <span className="num" style={{ fontSize: 12.5, width: 78, textAlign: "end" }}>{ils(value)}</span>
              </div>
            )
          )}
          <div className="hint">{`${t("annualTarget")}: ${ils(a.target)}`}</div>
        </div>

        <div className="card" style={{ padding: "15px 17px" }}>
          <div className="hint" style={{ marginBottom: 10 }}>{t("aging")}</div>
          {AGING.map(([label, lo, hi]) => {
            const v = rows("payments")
              .filter((p) => {
                const o = overdue(p);
                return o >= lo && o <= hi;
              })
              .reduce((s, p) => s + (Number(p.net) || 0), 0);
            return (
              <div key={label.he} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span className="num" style={{ width: 50, fontSize: 12.5, color: "var(--muted)" }}>{L(label)}</span>
                <Meter pct={a.openDebt ? (v / a.openDebt) * 100 : 0} tone="dan" />
                <span className="num" style={{ fontSize: 12.5, width: 78, textAlign: "end" }}>{ils(v)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Section
        title={t("salesBand")}
        sub={`${a.openDeals.length} ${L({ he: "פתוחות", en: "open" })} · ${a.won.length} ${L({ he: "נסגרו", en: "won" })}${a.stuck.length ? ` · ${a.stuck.length} ${L({ he: "תקועות", en: "stuck" })}` : ""}`}
      />
      <div className="card" style={{ padding: "15px 17px" }}>
        {funnel.map((f) => (
          <div key={f.st} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
            <span style={{ width: 100, fontSize: 12.5 }}>{L(E.stage[f.st])}</span>
            <Pill>{f.n}</Pill>
            <Meter pct={(f.amt / maxF) * 100} />
            <span className="num" style={{ fontSize: 12.5, width: 82, textAlign: "end" }}>{ils(f.amt)}</span>
          </div>
        ))}
      </div>

      {rows("batches").length ? (
        <>
          <Section title={t("vouchers")} />
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))" }}>
            <Kpi label={t("open")} value={fmtN(a.voucherCounts.cIssued || 0)} />
            <Kpi label={t("active")} value={fmtN((a.voucherCounts.cActive || 0) + (a.voucherCounts.cPartial || 0))} />
            <Kpi label={t("redeemed")} value={fmtN(a.voucherCounts.cRedeemed || 0)} />
            <Kpi label={t("expired")} value={fmtN(a.voucherCounts.cExpired || 0)} />
            <Kpi label={t("liability")} value={ils(a.openLiability)} />
          </div>
        </>
      ) : null}

      {rows("merchants").length ? (
        <>
          <Section title={t("impactBand")} />
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))" }}>
            <Kpi label={L({ he: "כסף שנכנס לעסקים", en: "Money to businesses" })} value={ils(a.toBusinesses)} />
            <Kpi label={L({ he: "עסקים שהצטרפו השנה", en: "Businesses joined this year" })} value={fmtN(a.newMerchants)} />
            <Kpi label={t("redemptions")} value={fmtN(a.redemptionCount)} />
            <Kpi label={t("events")} value={fmtN(rows("events").length)} />
          </div>
        </>
      ) : null}

      {rows("campaigns").filter((c) => c.status !== "done").length ? (
        <>
          <Section title={t("campaigns")} />
          <div className="card">
            {rows("campaigns")
              .filter((c) => c.status !== "done")
              .map((c) => {
                const p = progressOf(c);
                const pace = paceOf(c);
                return (
                  <div className="arow" key={c.id} onClick={() => onOpen({ coll: "campaigns", id: c.id })}>
                    <span className="txt">
                      <span className="t1">{SCHEMA.campaigns.title(c)}</span>
                      <span className="t2">
                        {`${fmtN(c.currentValue)} / ${fmtN(c.goal)}`}
                        {pace != null ? ` · ${t("pace")} ${pace.toFixed(2)}` : ""}
                      </span>
                    </span>
                    <Meter pct={p} tone={pace == null ? "" : pace < 0.7 ? "dan" : pace < 0.95 ? "warn" : "ok"} width={100} />
                    <span className="meta num">{`${Math.round(p)}%`}</span>
                  </div>
                );
              })}
          </div>
        </>
      ) : null}
    </>
  );
}
