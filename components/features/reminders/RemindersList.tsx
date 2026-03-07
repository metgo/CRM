"use client";

import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { ReminderWithClient } from "@/types/database";
import { Plus } from "lucide-react";
import { ReminderModal } from "./ReminderModal";

interface RemindersListProps {
  reminders: ReminderWithClient[];
  clientId?: string;
}

export function RemindersList({ reminders: initial, clientId }: RemindersListProps) {
  const [reminders, setReminders] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();

  const markDone = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("reminders")
      .update({ is_done: true, done_at: new Date().toISOString() })
      .eq("id", id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div>
      {reminders.length === 0 ? (
        <div className="p-4 text-center text-gray-400 text-sm">
          אין תזכורות פעילות
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {reminders.map((r) => {
            const isOverdue = new Date(r.due_at) < new Date();
            return (
              <div key={r.id} className={`p-4 ${isOverdue ? "bg-red-50" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {r.title}
                    </p>
                    {r.notes && (
                      <p className="text-xs text-gray-500 mt-0.5">{r.notes}</p>
                    )}
                    <p
                      className={`text-xs mt-1 ${isOverdue ? "text-red-600" : "text-gray-400"}`}
                    >
                      {format(new Date(r.due_at), "dd/MM/yyyy HH:mm", {
                        locale: he,
                      })}
                      {isOverdue && " (באיחור)"}
                    </p>
                  </div>
                  <button
                    onClick={() => markDone(r.id)}
                    className="text-xs text-green-600 hover:text-green-800 whitespace-nowrap"
                  >
                    ✓ בוצע
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <Plus className="w-4 h-4" />
          הוסף תזכורת
        </button>
      </div>

      {showAdd && clientId && (
        <ReminderModal
          client={{ id: clientId, name: "" } as any}
          onClose={() => {
            setShowAdd(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
