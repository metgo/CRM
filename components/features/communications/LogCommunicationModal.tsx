"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";
import { COMMUNICATION_TYPE_LABELS } from "@/lib/utils/hebrew-status";
import type { Client, Contact, CommunicationType } from "@/types/database";

interface LogCommunicationModalProps {
  client: Client;
  onClose: () => void;
}

const MANUAL_TYPES: CommunicationType[] = ["call", "meeting", "note"];

export function LogCommunicationModal({
  client,
  onClose,
}: LogCommunicationModalProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState({
    type: "call" as CommunicationType,
    contact_id: "",
    body: "",
    direction: "outbound" as "outbound" | "inbound",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadContacts = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("client_id", client.id)
        .is("deleted_at", null);
      setContacts(data ?? []);
    };
    loadContacts();
  }, [client.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { error } = await supabase.from("communications").insert({
      client_id: client.id,
      contact_id: form.contact_id || null,
      user_id: user.id,
      organization_id: profile?.organization_id ?? "",
      type: form.type,
      direction: form.direction,
      body: form.body,
      status: "logged",
    });

    if (error) {
      setError("שגיאה בשמירת הרשומה");
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
          <h3 className="font-semibold text-gray-900">תיעוד תקשורת</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">
            מועצה: <strong>{client.name}</strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סוג
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value as CommunicationType }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MANUAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {COMMUNICATION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כיוון
              </label>
              <select
                value={form.direction}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    direction: e.target.value as "outbound" | "inbound",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="outbound">יוצא</option>
                <option value="inbound">נכנס</option>
              </select>
            </div>
          </div>

          {contacts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                איש קשר
              </label>
              <select
                value={form.contact_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contact_id: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">לא צוין</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תיאור / הערות *
            </label>
            <textarea
              required
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="תאר את התקשורת..."
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
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "שומר..." : "שמור רשומה"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
