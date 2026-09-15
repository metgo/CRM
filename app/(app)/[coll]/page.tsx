"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { COLLECTIONS, type CollName } from "@/lib/mc/store";
import { DealsBoard } from "@/components/mc/pages/DealsBoard";
import { CollectionPage } from "@/components/mc/pages/CollectionPage";
import { useAppShell } from "@/components/mc/AppShell";

function isCollName(v: string): v is CollName {
  return (COLLECTIONS as readonly string[]).includes(v);
}

export default function CollectionRoute({ params }: { params: Promise<{ coll: string }> }) {
  const { coll } = use(params);
  const { openRecord } = useAppShell();

  if (!isCollName(coll)) notFound();

  if (coll === "deals") return <DealsBoard onOpen={openRecord} />;
  return <CollectionPage coll={coll} onOpen={openRecord} />;
}
