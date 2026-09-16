"use client";

import { Dashboard } from "@/components/mc/pages/Dashboard";
import { useAppShell } from "@/components/mc/AppShell";

export default function DashboardPage() {
  const { openRecord, showToast } = useAppShell();
  return <Dashboard onOpen={openRecord} onToast={showToast} />;
}
