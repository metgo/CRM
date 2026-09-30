"use client";

import { Vouchers } from "@/components/mc/pages/Vouchers";
import { useAppShell } from "@/components/mc/AppShell";

export default function VouchersPage() {
  const { openRecord } = useAppShell();
  return <Vouchers onOpen={openRecord} />;
}
