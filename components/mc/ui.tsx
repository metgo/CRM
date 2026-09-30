"use client";

import type { ReactNode } from "react";
import { enumClass, enumLabel } from "@/lib/mc/enums";
import { fmtN, fmtDate } from "@/lib/mc/format";
import { L, t, type Bi } from "@/lib/mc/i18n";

export const Num = ({ children }: { children: ReactNode }) => <span className="num">{children}</span>;

export const Money = ({ v }: { v: unknown }) => (
  <span className="num">₪{fmtN(v)}</span>
);

export const DateText = ({ v }: { v?: string | null }) =>
  v ? <span className="num">{fmtDate(v)}</span> : <>—</>;

export function Pill({
  group, value, tone, children
}: { group?: string; value?: string | null; tone?: string; children?: ReactNode }) {
  if (group && value) {
    return <span className={`pill ${enumClass(group, value)}`}>{enumLabel(group, value)}</span>;
  }
  return <span className={`pill ${tone || "p-mute"}`}>{children}</span>;
}

export const Meter = ({ pct, tone, width }: { pct: number; tone?: string; width?: number }) => (
  <span className={`meter ${tone || ""}`} style={width ? { width, display: "inline-block", verticalAlign: "middle" } : undefined}>
    <i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
  </span>
);

export function Section({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="sechead">
      <h3>{title}</h3>
      {sub ? <span className="sub">{sub}</span> : null}
      {action ? <span className="act">{action}</span> : null}
    </div>
  );
}

export function Kpi({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="card kpi">
      <div className="lab">{label}</div>
      <div className="val">{value}</div>
      {note ? <div className="cmp">{note}</div> : null}
    </div>
  );
}

export function EmptyState({ onAdd, label }: { onAdd?: () => void; label?: string }) {
  return (
    <div className="tablewrap">
      <div className="empty">
        <b>{t("emptyTitle")}</b>
        {t("emptyBody")}
        {onAdd ? (
          <div style={{ marginTop: 14 }}>
            <button className="tbtn pri" onClick={onAdd}>+ {label || t("addRecord")}</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <span
      className={`toggle ${on ? "on" : ""}`}
      role="switch"
      aria-checked={on}
      tabIndex={0}
      onClick={() => onChange(!on)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!on);
        }
      }}
    >
      <i />
    </span>
  );
}

export const Bilingual = ({ v }: { v: Bi }) => <>{L(v)}</>;
