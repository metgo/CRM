"use client";

import { useState } from "react";
import { rows, type CollName } from "@/lib/mc/store";
import { SCHEMA, disp, nameOf } from "@/lib/mc/schema";
import { E } from "@/lib/mc/enums";
import { L, t } from "@/lib/mc/i18n";
import { daysAgo, fmtN } from "@/lib/mc/format";
import { isStuck } from "@/lib/mc/compute";
import { DataTable } from "../DataTable";
import { EmptyState, Pill } from "../ui";

const STAGES = ["lead", "meeting", "quote", "verbal", "po", "won"];

export function DealsBoard({
  onOpen
}: { onOpen: (target: { coll: CollName; id: string | null }) => void }) {
  const [mode, setMode] = useState<"board" | "table">("board");
  const deals = rows("deals");

  const header = (
    <div className="sechead">
      <span className="chipbar">
        {(["board", "table"] as const).map((k) => (
          <button key={k} className={`chip ${mode === k ? "on" : ""}`} onClick={() => setMode(k)}>
            {t(k)}
          </button>
        ))}
      </span>
      <span className="sub">{deals.length} {t("records")}</span>
      <span className="act">
        <button className="tbtn pri" onClick={() => onOpen({ coll: "deals", id: null })}>+ {t("addRecord")}</button>
      </span>
    </div>
  );

  if (!deals.length) return <>{header}<EmptyState onAdd={() => onOpen({ coll: "deals", id: null })} /></>;

  if (mode === "table") {
    const sorted = deals.slice().sort((a, b) => String(a.expected || "").localeCompare(String(b.expected || "")));
    return <>{header}<DataTable cols={SCHEMA.deals.cols} data={sorted} onOpen={(r) => onOpen({ coll: "deals", id: r.id })} /></>;
  }

  return (
    <>
      {header}
      <div className="kanban">
        {STAGES.map((st) => {
          const list = deals.filter((d) => d.stage === st);
          const sum = list.reduce((s, d) => s + (Number(d.net) || 0), 0);
          return (
            <div className="kcol" key={st}>
              <h4>
                {L(E.stage[st])}
                <span className="c">{list.length}</span>
                <span className="s">₪{fmtN(sum / 1000)}K</span>
              </h4>
              <div className="kcards">
                {list.length === 0 ? <div className="hint" style={{ padding: "6px 4px" }}>—</div> : null}
                {list.map((d) => {
                  const stuck = isStuck(d);
                  const inStage = daysAgo(d.stageSince);
                  return (
                    <button
                      key={d.id}
                      className={`kcard ${stuck ? "bn" : ""}`}
                      onClick={() => onOpen({ coll: "deals", id: d.id })}
                    >
                      <div className="n">{disp(d, "title")}</div>
                      <div className="c">{nameOf("clients", d.client)}</div>
                      <div className="f">
                        <span className="amt">₪{fmtN(d.net)}</span>
                        {inStage != null ? (
                          stuck
                            ? <Pill tone="p-dan">{`${inStage}${t("d")}`}</Pill>
                            : <span className="hint num">{`${inStage}${t("d")}`}</span>
                        ) : null}
                        {!d.next && !["won", "lost"].includes(d.stage)
                          ? <Pill tone="p-warn">{t("noNextStep")}</Pill> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
