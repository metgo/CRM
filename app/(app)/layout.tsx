import "../mc.css";
import { AppShell } from "@/components/mc/AppShell";

export const metadata = {
  title: "Metgo CRM — Operations",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
