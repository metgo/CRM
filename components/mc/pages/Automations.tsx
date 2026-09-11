"use client";

import { rows, save } from "@/lib/mc/store";
import { L, t } from "@/lib/mc/i18n";
import { buildAlerts } from "@/lib/mc/alerts";
import { Pill, Toggle } from "../ui";

export function Automations({ onToast }: { onToast: (m: string) => void }) {
  const list = rows("automations").slice().sort((a, b) => Number(a.n) - Number(b.n));
  const firing = buildAlerts().reduce<Record<number, number>>((acc, a) => {
    acc[a.rule] = (acc[a.rule] || 0) + 1;
    return acc;
  }, {});

  const toggle = async (rec: any, on: boolean) => {
    try {
      await save("automations", rec.id, { ...rec, on });
    } catch (e) {
      onToast((e as Error).message);
    }
  };

  if (!list.length) {
    return (
      <div className="note w">
        {L({
          he: "חוקי האוטומציה לא נטענו. הריצו את migration:run כדי לטעון את 24 החוקים.",
          en: "No automation rules loaded. Run `yarn migration:run` to load the 24 rules."
        })}
      </div>
    );
  }

  return (
    <>
      <div className="note" style={{ marginBottom: 14 }}>{t("alertsNote")}</div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{t("trigger")}</th>
              <th>{t("condition")}</th>
              <th>{t("action")}</th>
              <th>{t("recipient")}</th>
              <th>{t("firingNow")}</th>
              <th>{t("enabled")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td><span className="num">{a.n}</span></td>
                <td><b>{L(a.trig)}</b></td>
                <td>{L(a.cond)}</td>
                <td>{L(a.act)}</td>
                <td>{L(a.to)}</td>
                <td>{firing[Number(a.n)] ? <Pill tone="p-warn">{firing[Number(a.n)]}</Pill> : <span className="hint">—</span>}</td>
                <td><Toggle on={a.on !== false} onChange={(v) => void toggle(a, v)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
