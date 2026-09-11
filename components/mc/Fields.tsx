"use client";

import type { Field } from "@/lib/mc/schema";
import { nameOf, SCHEMA } from "@/lib/mc/schema";
import { E } from "@/lib/mc/enums";
import { L, t } from "@/lib/mc/i18n";
import { rows, type Rec } from "@/lib/mc/store";
import { Toggle } from "./ui";

type Props = {
  fields: Field[];
  value: Rec;
  errors: Set<string>;
  onChange: (next: Rec) => void;
};

const clone = (r: Rec): Rec => JSON.parse(JSON.stringify(r ?? {}));

function Input({ f, v, set }: { f: Field; v: any; set: (val: any) => void }) {
  switch (f.t) {
    case "textarea":
      return <textarea value={v ?? ""} onChange={(e) => set(e.target.value)} />;
    case "num":
    case "money":
    case "pct":
      return (
        <input
          type="number"
          step={f.t === "pct" ? "0.1" : "1"}
          value={v ?? ""}
          onChange={(e) => set(e.target.value === "" ? null : Number(e.target.value))}
        />
      );
    case "date":
      return <input type="date" value={(v ?? "").toString().slice(0, 10)} onChange={(e) => set(e.target.value || null)} />;
    case "bool":
      return <span className="swline"><Toggle on={!!v} onChange={set} /></span>;
    case "enum": {
      const group = E[f.e || ""] || {};
      return (
        <select value={v ?? ""} onChange={(e) => set(e.target.value || null)}>
          <option value="">—</option>
          {Object.keys(group).map((k) => (
            <option key={k} value={k}>{L(group[k])}</option>
          ))}
        </select>
      );
    }
    case "ref": {
      const coll = f.c!;
      const list = rows(coll)
        .slice()
        .sort((a, b) => SCHEMA[coll].title(a).localeCompare(SCHEMA[coll].title(b)));
      return (
        <select value={v ?? ""} onChange={(e) => set(e.target.value || null)}>
          <option value="">—</option>
          {list.map((o) => (
            <option key={o.id} value={o.id}>{nameOf(coll, o.id)}</option>
          ))}
        </select>
      );
    }
    case "refs": {
      const coll = f.c!;
      const list = rows(coll);
      const cur: string[] = Array.isArray(v) ? v : [];
      if (!list.length) return <span className="hint">{L({ he: "אין רשומות לבחירה", en: "Nothing to choose yet" })}</span>;
      return (
        <span className="checks">
          {list.map((o) => {
            const on = cur.includes(o.id);
            return (
              <label key={o.id} className={on ? "on" : ""}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => set(e.target.checked ? [...cur, o.id] : cur.filter((x) => x !== o.id))}
                />
                {nameOf(coll, o.id)}
              </label>
            );
          })}
        </span>
      );
    }
    default:
      return <input type="text" value={v ?? ""} onChange={(e) => set(e.target.value)} />;
  }
}

export function FormFields({ fields, value, errors, onChange }: Props) {
  const setField = (key: string, val: any) => {
    const next = clone(value);
    next[key] = val;
    onChange(next);
  };

  return (
    <div className="form">
      {fields.map((f) => {
        if (f.t === "list") {
          const list: Rec[] = Array.isArray(value[f.k]) ? value[f.k] : [];
          return (
            <div className="fld" key={f.k}>
              <label>{L(f.l)}</label>
              <div className="rep">
                {list.map((row, i) => (
                  <div className="repitem" key={i}>
                    <button
                      className="del"
                      aria-label={t("del")}
                      onClick={() => {
                        const next = list.slice();
                        next.splice(i, 1);
                        setField(f.k, next);
                      }}
                    >
                      ✕
                    </button>
                    <div className="repgrid">
                      {(f.sub || []).map((sf) => (
                        <div className="fld" key={sf.k}>
                          <label>{L(sf.l)}</label>
                          <Input
                            f={sf}
                            v={row[sf.k]}
                            set={(val) => {
                              const next = list.slice();
                              next[i] = { ...next[i], [sf.k]: val };
                              setField(f.k, next);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="tbtn"
                style={{ alignSelf: "flex-start", marginTop: 6 }}
                onClick={() => setField(f.k, [...list, {}])}
              >
                + {t("addRow")}
              </button>
            </div>
          );
        }
        const bad = errors.has(f.k);
        return (
          <div className={`fld ${bad ? "err" : ""}`} key={f.k}>
            <label>
              {L(f.l)}
              {f.req ? <span style={{ color: "var(--danger)" }}> *</span> : null}
            </label>
            <Input f={f} v={value[f.k]} set={(val) => setField(f.k, val)} />
            {f.hint ? <span className="hint">{L(f.hint)}</span> : null}
            {bad ? <span className="errmsg">{t("required")}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
