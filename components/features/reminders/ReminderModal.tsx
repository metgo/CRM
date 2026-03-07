"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";
import type { Client } from "@/types/database";

interface ReminderModalProps {
  client: Client;
  onClose: () => void;
}

export function ReminderModal({ client, onClose }: ReminderModalProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    notes: "",
    due_at: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { error } = await supabase.from("reminders").insert({
      title: form.title,
      notes: form.notes || null,
      due_at: new Date(form.due_at).toISOString(),
      client_id: client.id,
      user_id: user.id,
      organization_id: profile?.organization_id ?? "",
    });

    if (error) {
      setError("שגיאה בשמירת התזכורת");
      setLoading(false);
      return;
    }

    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">תזכורת חדשה</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {client.name && (
            <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">
              מועצה: <strong>{client.name}</strong>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              כותרת התזכורת *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="לדוגמה: לחזור בנוגע להצעה"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תוכן / הערות
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="פרטים נוספים..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תאריך ושעה *
            </label>
            <input
              type="datetime-local"
              required
              value={form.due_at}
              onChange={(e) => setForm((p) => ({ ...p, due_at: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? "שומר..." : "שמור תזכורת"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
