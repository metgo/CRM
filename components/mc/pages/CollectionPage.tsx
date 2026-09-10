"use client";

import { SCHEMA } from "@/lib/mc/schema";
import { rows, type CollName, type Rec } from "@/lib/mc/store";
import { t } from "@/lib/mc/i18n";
import { DataTable } from "../DataTable";
import { EmptyState } from "../ui";

export function CollectionPage({
  coll, onOpen
}: { coll: CollName; onOpen: (target: { coll: CollName; id: string | null }) => void }) {
  const schema = SCHEMA[coll];
  const list: Rec[] = rows(coll).slice();
  list.sort(schema.sort || ((a, b) => schema.title(a).localeCompare(schema.title(b))));

  return (
    <>
      <div className="sechead">
        <span className="sub">{list.length} {t("records")}</span>
        <span className="act">
          <button className="tbtn pri" onClick={() => onOpen({ coll, id: null })}>+ {t("addRecord")}</button>
        </span>
      </div>
      {list.length ? (
        <DataTable cols={schema.cols} data={list} onOpen={(r) => onOpen({ coll, id: r.id })} />
      ) : (
        <EmptyState onAdd={() => onOpen({ coll, id: null })} />
      )}
    </>
  );
}
