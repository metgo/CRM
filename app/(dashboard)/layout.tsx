"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar, getPageTitle } from "@/components/layout/TopBar";
import { useReminders } from "@/lib/hooks/useReminders";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { overdue, upcoming, totalActive, markDone } = useReminders();
  const title = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar reminderCount={overdue.length} />
      <div className="mr-64">
        <TopBar
          title={title}
          overdueReminders={overdue}
          upcomingReminders={upcoming}
          totalActive={totalActive}
          onMarkDone={markDone}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
