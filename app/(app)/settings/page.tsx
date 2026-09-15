"use client";

import { SettingsPage } from "@/components/mc/pages/SettingsPage";
import { useAppShell } from "@/components/mc/AppShell";

export default function SettingsRoute() {
  const { openRecord, showToast } = useAppShell();
  return <SettingsPage onOpen={openRecord} onToast={showToast} />;
}
