"use client";

import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, Download, Check } from "lucide-react";
import { exportToCSV } from "@/lib/utils/csv-export";
import type { ReminderWithClient } from "@/types/database";

interface RemindersPageContentProps {
  reminders: ReminderWithClient[];
  organizationId: string;
  userId: string;
}

export function RemindersPageContent({
  reminders: initial,
  organizationId,
  userId,
}: RemindersPageContentProps) {
  const router = useRouter();
  const [reminders, setReminders] = useState(initial);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("pending");
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", notes: "", due_at: "", client_id: "" });
  const [loading, setLoading] = useState(false);

  const filtered = reminders.filter((r) => {
    if (filter === "pending") return !r.is_done;
    if (filter === "done") return r.is_done;
    return true;
  });

  const markDone = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("reminders")
      .update({ is_done: true, done_at: new Date().toISOString() })
      .eq("id", id);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_done: true } : r))
    );
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("reminders")
      .insert({
        title: newForm.title,
        notes: newForm.notes || null,
        due_at: new Date(newForm.due_at).toISOString(),
        client_id: newForm.client_id || null,
        user_id: userId,
        organization_id: organizationId,
      })
      .select("*, clients(id, name)")
      .single();

    if (data) {
      setReminders((prev) => [data as ReminderWithClient, ...prev]);
    }
    setShowAdd(false);
    setNewForm({ title: "", notes: "", due_at: "", client_id: "" });
    setLoading(false);
  };

  const handleExport = () => {
    exportToCSV(
      filtered.map((r) => ({
        ...r,
        client_name: r.clients?.name ?? "",
        due_at_formatted: format(new Date(r.due_at), "dd/MM/yyyy HH:mm", { locale: he }),
        status: r.is_done ? "בוצע" : "פתוח",
      })),
      [
        { key: "title", label: "כותרת" },
        { key: "notes", label: "הערות" },
        { key: "client_name", label: "מועצה" },
        { key: "due_at_formatted", label: "תאריך" },
        { key: "status", label: "סטטוס" },
      ],
      "תזכורות"
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {(["all", "pending", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "הכל" : f === "pending" ? "פתוחות" : "הושלמו"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          תזכורת חדשה
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          CSV
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-blue-200 p-4 space-y-3">
          <h4 className="font-medium text-gray-900">תזכורת חדשה</h4>
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="כותרת התזכורת"
              value={newForm.title}
              onChange={(e) => setNewForm((p) => ({ ...p, title: e.target.value }))}
              className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="datetime-local"
              required
              value={newForm.due_at}
              onChange={(e) => setNewForm((p) => ({ ...p, due_at: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="הערות (אופציונלי)"
              value={newForm.notes}
              onChange={(e) => setNewForm((p) => ({ ...p, notes: e.target.value }))}
              rows={1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              שמור
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              ביטול
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">כותרת</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">מועצה</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!filtered.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                  אין תזכורות
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isOverdue = !r.is_done && new Date(r.due_at) < new Date();
                return (
                  <tr key={r.id} className={`hover:bg-gray-50 ${isOverdue ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{r.title}</p>
                      {r.notes && <p className="text-xs text-gray-500 truncate max-w-xs">{r.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {r.clients?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
                        {format(new Date(r.due_at), "dd/MM/yyyy HH:mm", { locale: he })}
                        {isOverdue && " (באיחור)"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.is_done
                          ? "bg-green-100 text-green-800"
                          : isOverdue
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {r.is_done ? "בוצע" : isOverdue ? "באיחור" : "פתוח"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!r.is_done && (
                        <button
                          onClick={() => markDone(r.id)}
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
                        >
                          <Check className="w-3 h-3" />
                          בוצע
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
