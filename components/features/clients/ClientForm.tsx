"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUSES,
} from "@/lib/utils/hebrew-status";
import type { Client, ClientStatus } from "@/types/database";

interface ProfileOption {
  id: string;
  full_name: string;
}

interface ClientFormProps {
  client?: Client;
  profiles: ProfileOption[];
  organizationId: string;
}

export function ClientForm({ client, profiles, organizationId }: ClientFormProps) {
  const router = useRouter();
  const isEdit = !!client;

  const [form, setForm] = useState({
    name: client?.name ?? "",
    status: (client?.status ?? "lead") as ClientStatus,
    region: client?.region ?? "",
    address: client?.address ?? "",
    website: client?.website ?? "",
    notes: client?.notes ?? "",
    assigned_to: client?.assigned_to ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        status: form.status,
        region: form.region || null,
        address: form.address || null,
        website: form.website || null,
        notes: form.notes || null,
        assigned_to: form.assigned_to || null,
      };

      const url = isEdit ? `/api/clients/${client.id}` : "/api/clients";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError("שגיאה בשמירת הנתונים. נסה שוב.");
        setLoading(false);
        return;
      }

      router.push("/clients");
      router.refresh();
    } catch {
      setError("שגיאה בשמירת הנתונים. נסה שוב.");
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">פרטי המועצה</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם המועצה *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="מועצה אזורית..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סטטוס
            </label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CLIENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CLIENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              אחראי
            </label>
            <select
              value={form.assigned_to}
              onChange={(e) => update("assigned_to", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ללא</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              אזור
            </label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="צפון, מרכז..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              אתר אינטרנט
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://"
              dir="ltr"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              כתובת
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              הערות
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading ? "שומר..." : isEdit ? "שמור שינויים" : "צור מועצה"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
