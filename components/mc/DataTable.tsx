"use client";

import type { Column } from "@/lib/mc/schema";
import { L } from "@/lib/mc/i18n";
import type { Rec } from "@/lib/mc/store";

export function DataTable({
  cols, data, onOpen
}: { cols: Column[]; data: Rec[]; onOpen?: (r: Rec) => void }) {
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>{cols.map((c, i) => <th key={i}>{L(c.h)}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr
              key={r.id}
              className={onOpen ? "clickable" : ""}
              onClick={onOpen ? () => onOpen(r) : undefined}
            >
              {cols.map((c, i) => <td key={i}>{c.cell(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
