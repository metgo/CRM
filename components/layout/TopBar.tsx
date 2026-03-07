"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import type { ReminderWithClient } from "@/types/database";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  overdueReminders: ReminderWithClient[];
  upcomingReminders: ReminderWithClient[];
  totalActive: number;
  onMarkDone: (id: string) => void;
}

export function TopBar({
  title,
  overdueReminders,
  upcomingReminders,
  totalActive,
  onMarkDone,
}: TopBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {totalActive > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {totalActive > 9 ? "9+" : totalActive}
            </span>
          )}
        </button>

        {/* Reminder Drawer */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">תזכורות</h3>
              </div>

              {overdueReminders.length === 0 && upcomingReminders.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  אין תזכורות פעילות
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {overdueReminders.map((r) => (
                    <div key={r.id} className="p-3 bg-red-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {r.title}
                          </p>
                          {r.clients && (
                            <p className="text-xs text-gray-500 truncate">
                              {r.clients.name}
                            </p>
                          )}
                          <p className="text-xs text-red-600 mt-0.5">
                            באיחור -{" "}
                            {format(new Date(r.due_at), "dd/MM/yyyy HH:mm", {
                              locale: he,
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => onMarkDone(r.id)}
                          className="text-xs text-green-600 hover:text-green-800 whitespace-nowrap"
                        >
                          ✓ בוצע
                        </button>
                      </div>
                    </div>
                  ))}
                  {upcomingReminders.map((r) => (
                    <div key={r.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {r.title}
                          </p>
                          {r.clients && (
                            <p className="text-xs text-gray-500 truncate">
                              {r.clients.name}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-0.5">
                            {format(new Date(r.due_at), "dd/MM/yyyy HH:mm", {
                              locale: he,
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => onMarkDone(r.id)}
                          className="text-xs text-green-600 hover:text-green-800 whitespace-nowrap"
                        >
                          ✓ בוצע
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}

// Page title mapping
export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "דאשבורד",
  "/clients": "מועצות",
  "/contacts": "אנשי קשר",
  "/communications": "היסטוריית תקשורת",
  "/templates": "תבניות הודעה",
  "/reminders": "תזכורות",
  "/settings": "הגדרות",
};

export function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/clients/new")) return "לקוח חדש";
  if (pathname.startsWith("/clients/") && pathname.includes("/edit")) return "עריכת לקוח";
  if (pathname.startsWith("/clients/")) return "פרטי מועצה";
  if (pathname.startsWith("/contacts/")) return "פרטי איש קשר";
  if (pathname.startsWith("/templates/new")) return "תבנית חדשה";
  if (pathname.startsWith("/templates/")) return "עריכת תבנית";
  return "MetGo CRM";
}
