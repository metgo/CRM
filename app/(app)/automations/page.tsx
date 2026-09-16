"use client";

import { Automations } from "@/components/mc/pages/Automations";
import { useAppShell } from "@/components/mc/AppShell";

export default function AutomationsPage() {
  const { showToast } = useAppShell();
  return <Automations onToast={showToast} />;
}
