"use client";

import { useEffect, useMemo, useState } from "react";
import type { CollName, Rec } from "@/lib/mc/store";
import { getRec, remove, rows, save } from "@/lib/mc/store";
import { SCHEMA, disp, nameOf } from "@/lib/mc/schema";
import type { Field } from "@/lib/mc/schema";
import { L, t } from "@/lib/mc/i18n";
import { enumLabel } from "@/lib/mc/enums";
import { fmtDate, fmtN, ils, daysAgo, dayWord } from "@/lib/mc/format";
import { gapDays, isStuck, lastContactDays, overdue, paceOf, progressOf, quoteNet, redeemedPct, stageSla, vatRate } from "@/lib/mc/compute";
import { getSettings } from "@/lib/mc/store";
import { FormFields } from "./Fields";
import { Meter, Pill } from "./ui";

export type DrawerTarget = { coll: CollName; id: string | null } | null;

const defaults = (fields: Field[]): Rec => {
  const o: Rec = {};
  fields.forEach((f) => {
    if (f.def !== undefined) o[f.k] = f.def;
  });
  return o;
};

function ViewValue({ f, r }: { f: Field; r: Rec }) {
  const v = r[f.k];
  if (v === undefined || v === null || v === "") return <>—</>;
  switch (f.t) {
    case "money": return <span className="num">{ils(v)}</span>;
    case "pct": return <span className="num">{`${v}%`}</span>;
    case "num": return <span className="num">{fmtN(v)}</span>;
    case "date": return <span className="num">{fmtDate(v)}</span>;
    case "bool": return v ? <Pill tone="p-ok">{t("yes")}</Pill> : <Pill>{t("no")}</Pill>;
    case "enum": return <Pill group={f.e} value={v} />;
    case "ref": return <>{nameOf(f.c!, v)}</>;
    case "refs": return <>{(v as string[]).map((x) => nameOf(f.c!, x)).join(", ") || "—"}</>;
    case "textarea":
      return <>{String(v).split("\n").map((line, i) => <div key={i}>{line}</div>)}</>;
    default: return <>{String(v)}</>;
  }
}

function SubRows({ f, list }: { f: Field; list: Rec[] }) {
  if (!list?.length) return <span className="hint">{t("emptyTitle")}</span>;
  return (
    <div className="sublist" style={{ marginTop: 4 }}>
      {list.map((row, i) => (
        <div className="subitem" key={i}>
          <div className="h">
            <b>
              {(() => {
                const first = (f.sub || [])[0];
                if (!first) return "";
                const v = row[first.k];
                return first.t === "ref" ? nameOf(first.c!, v) : String(v ?? "");
              })()}
            </b>
          </div>
          <div className="m">
            {(f.sub || []).slice(1).map((sf) => {
              const v = row[sf.k];
              if (v === undefined || v === null || v === "") return null;
              if (sf.t === "bool") return v ? <Pill key={sf.k} tone="p-ok">{L(sf.l)}</Pill> : null;
              const text = sf.t === "money" ? ils(v) : sf.t === "date" ? fmtDate(v) : sf.t === "num" ? fmtN(v) : String(v);
              return <span key={sf.k} style={{ marginInlineEnd: 10 }}>{text}</span>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function computedRows(coll: CollName, r: Rec): Array<[string, React.ReactNode]> {
  const out: Array<[string, React.ReactNode]> = [];
  const s = getSettings();
  if (coll === "deals") {
    const n = daysAgo(r.stageSince);
    const sla = stageSla(r.stage);
    if (n != null && sla) {
      out.push([t("daysInStage"), isStuck(r)
        ? <Pill tone="p-dan"><span className="num">{`${n} / ${sla}`}</span></Pill>
        : <span className="num">{`${n} / ${sla}`}</span>]);
    }
    const g = gapDays(r);
    if (g != null) {
      out.push([t("verbalGap"),
        <Pill tone={g <= s.gapOk ? "p-ok" : g <= s.gapWarn ? "p-warn" : "p-dan"}>{`${g} ${t("days")}`}</Pill>]);
    }
    if (r.net) {
      out.push([t("vat"), <span className="num">{ils(Number(r.net) * vatRate())}</span>]);
      out.push([t("gross"), <span className="num">{ils(Number(r.net) * (1 + vatRate()))}</span>]);
      if (r.commissionPct) {
        out.push([t("commission"), <span className="num">{ils((Number(r.net) * Number(r.commissionPct)) / 100)}</span>]);
      }
    }
    if (!r.next && !["won", "lost"].includes(r.stage)) {
      out.push([t("nextAction"), <Pill tone="p-warn">{t("notSet")}</Pill>]);
    }
  }
  if (coll === "payments") {
    const net = Number(r.net) || 0;
    out.push([t("vat"), <span className="num">{ils(net * vatRate())}</span>]);
    out.push([t("gross"), <span className="num">{ils(net * (1 + vatRate()))}</span>]);
    const o = overdue(r);
    if (o) out.push([L({ he: "ימי פיגור", en: "Days overdue" }), <Pill tone={o > 60 ? "p-dan" : "p-warn"}>{o}</Pill>]);
  }
  if (coll === "quotes") {
    const n = quoteNet(r);
    out.push([t("subtotal"), <span className="num">{ils(n)}</span>]);
    out.push([t("vat"), <span className="num">{ils(n * vatRate())}</span>]);
    out.push([t("totalIncl"), <span className="num">{ils(n * (1 + vatRate()))}</span>]);
  }
  if (coll === "campaigns") {
    const p = progressOf(r);
    const pc = paceOf(r);
    out.push([t("progress"), <><span className="num">{`${Math.round(p)}%`}</span> <Meter pct={p} width={80} /></>]);
    if (pc != null) out.push([t("pace"), <Pill tone={pc < 0.7 ? "p-dan" : pc < 0.95 ? "p-warn" : "p-ok"}>{pc.toFixed(2)}</Pill>]);
  }
  if (coll === "batches") {
    out.push([L({ he: "שווי נקוב כולל", en: "Total face value" }),
      <span className="num">{ils((Number(r.issued) || 0) * (Number(r.face) || 0))}</span>]);
    out.push([L({ he: "אחוז מימוש", en: "Redeemed %" }), <span className="num">{`${redeemedPct(r)}%`}</span>]);
  }
  if (coll === "clients") {
    const lc = lastContactDays(r.id);
    if (lc != null) out.push([t("lastContact"), lc > 90 ? <Pill tone="p-warn">{dayWord(lc)}</Pill> : <span className="num">{dayWord(lc)}</span>]);
  }
  return out;
}

export function RecordDrawer({
  target, onClose, onOpen, onToast
}: {
  target: DrawerTarget;
  onClose: () => void;
  onOpen: (t: DrawerTarget) => void;
  onToast: (msg: string) => void;
}) {
  const coll = target?.coll;
  const id = target?.id ?? null;
  const schema = coll ? SCHEMA[coll] : null;
  const record = coll && id ? getRec(coll, id) : undefined;

  const [mode, setMode] = useState<"view" | "edit">(id ? "view" : "edit");
  const [tab, setTab] = useState(0);
  const [draft, setDraft] = useState<Rec>({});
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!coll || !schema) return;
    setTab(0);
    setErrors(new Set());
    if (id) {
      setMode("view");
      setDraft({});
    } else {
      setMode("edit");
      setDraft(defaults(schema.fields));
    }
  }, [coll, id]);

  const related = useMemo(() => {
    if (!schema || !record) return [];
    return (schema.related || []).map(([rc, key]) => ({
      coll: rc,
      key,
      list: key === "contactsMulti"
        ? rows(rc).filter((x) => (x.contacts || []).includes(record.id))
        : rows(rc).filter((x) => x[key] === record.id)
    }));
  }, [schema, record, target]);

  if (!coll || !schema) {
    return <><div className="scrim" /><aside className="drawer" aria-hidden="true" /></>;
  }

  const tabs = mode === "view" && record
    ? [{ label: t("details") } as { label: string; rel?: (typeof related)[number] },
       ...related.map((r) => ({ label: t(r.coll), rel: r }))]
    : [{ label: t("details") }];
  const activeTab = tabs[Math.min(tab, tabs.length - 1)];

  const startEdit = () => {
    setDraft(JSON.parse(JSON.stringify(record || {})));
    setMode("edit");
  };

  const doSave = async () => {
    const missing = new Set<string>();
    schema.fields.forEach((f) => {
      if (f.req) {
        const v = draft[f.k];
        if (v === undefined || v === null || v === "") missing.add(f.k);
      }
    });
    if (missing.size) {
      setErrors(missing);
      onToast(t("required"));
      return;
    }
    const next = JSON.parse(JSON.stringify(draft));
    delete next.id;
    schema.beforeSave?.(next, record);
    setBusy(true);
    try {
      const saved = await save(coll, id, next);
      onToast(t("saved"));
      onOpen({ coll, id: saved.id });
    } catch (e) {
      onToast(`${t("saveFailed")}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!id || !window.confirm(t("confirmDel"))) return;
    setBusy(true);
    try {
      await remove(coll, id);
      onToast(t("deleted"));
      onClose();
    } catch (e) {
      onToast(`${t("saveFailed")}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const title = record ? schema.title(record) : `${t("addRecord")} · ${t(coll)}`;
  const computed = record ? computedRows(coll, record) : [];

  return (
    <>
      <div className="scrim on" onClick={onClose} />
      <aside className="drawer on" aria-hidden="false">
        <div className="dhead">
          <button className="dclose" onClick={onClose} aria-label={t("cancel")}>✕</button>
          <div className="k">{t(coll)}</div>
          <h3>{title}</h3>
          <div className="row">{record && schema.meta ? schema.meta(record) : null}</div>
        </div>

        {tabs.length > 1 ? (
          <div className="dtabs">
            {tabs.map((x, i) => (
              <button key={i} className={`dtab ${i === Math.min(tab, tabs.length - 1) ? "on" : ""}`} onClick={() => setTab(i)}>
                {x.label}
                {x.rel ? <span className="hint"> {x.rel.list.length}</span> : null}
              </button>
            ))}
          </div>
        ) : null}

        <div className="dbody">
          {mode === "edit" ? (
            <FormFields fields={schema.fields} value={draft} errors={errors} onChange={setDraft} />
          ) : activeTab.rel ? (
            activeTab.rel.list.length ? (
              <div className="sublist">
                {activeTab.rel.list.map((x) => (
                  <div
                    className="subitem"
                    key={x.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => onOpen({ coll: activeTab.rel!.coll, id: x.id })}
                  >
                    <div className="h"><b>{SCHEMA[activeTab.rel!.coll].title(x)}</b></div>
                    <div className="m">
                      {SCHEMA[activeTab.rel!.coll].cols.slice(1, 4).map((c, i) => (
                        <span key={i} style={{ marginInlineEnd: 10 }}>{c.cell(x)}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                <b>{t("emptyTitle")}</b>
                {t("emptyBody")}
                <div style={{ marginTop: 12 }}>
                  <button className="tbtn pri" onClick={() => onOpen({ coll: activeTab.rel!.coll, id: null })}>
                    + {t("addRecord")}
                  </button>
                </div>
              </div>
            )
          ) : record ? (
            <>
              <div className="fl">
                {schema.fields.map((f) => {
                  if (f.t === "list") return null;
                  const v = record[f.k];
                  if (v === undefined || v === null || v === "") return null;
                  return (
                    <div key={f.k} style={{ display: "contents" }}>
                      <div className="k">{L(f.l)}</div>
                      <div className="v"><ViewValue f={f} r={record} /></div>
                    </div>
                  );
                })}
              </div>

              {computed.length ? (
                <div style={{ marginTop: 14 }}>
                  <div className="hint" style={{ marginBottom: 4 }}>{t("computed")}</div>
                  <div className="fl">
                    {computed.map(([k, node], i) => (
                      <div key={i} style={{ display: "contents" }}>
                        <div className="k">{k}</div>
                        <div className="v">{node}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {schema.fields
                .filter((f) => f.t === "list" && (record[f.k] || []).length)
                .map((f) => (
                  <div key={f.k} style={{ marginTop: 16 }}>
                    <div className="hint" style={{ marginBottom: 6 }}>{L(f.l)}</div>
                    <SubRows f={f} list={record[f.k]} />
                  </div>
                ))}
            </>
          ) : null}
        </div>

        <div className="dfoot">
          {mode === "edit" ? (
            <>
              <button className="tbtn pri" onClick={doSave} disabled={busy}>{t("save")}</button>
              <button className="tbtn" onClick={() => (id ? setMode("view") : onClose())}>{t("cancel")}</button>
            </>
          ) : (
            <>
              <button className="tbtn pri" onClick={startEdit}>{t("edit")}</button>
              <span className="sp" />
              <button className="tbtn dan" onClick={doDelete} disabled={busy}>{t("del")}</button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
