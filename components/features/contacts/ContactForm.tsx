"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Contact } from "@/types/database";

interface ContactFormProps {
  clientId: string;
  organizationId: string;
  contact?: Contact;
}

export function ContactForm({ clientId, organizationId, contact }: ContactFormProps) {
  const router = useRouter();
  const isEdit = !!contact;

  const [form, setForm] = useState({
    first_name: contact?.first_name ?? "",
    last_name: contact?.last_name ?? "",
    role_title: contact?.role_title ?? "",
    phone: contact?.phone ?? "",
    email: contact?.email ?? "",
    whatsapp: contact?.whatsapp ?? "",
    is_primary: contact?.is_primary ?? false,
    notes: contact?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string | boolean) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const payload = {
      client_id: clientId,
      organization_id: organizationId,
      first_name: form.first_name,
      last_name: form.last_name,
      role_title: form.role_title || null,
      phone: form.phone || null,
      email: form.email || null,
      whatsapp: form.whatsapp || null,
      is_primary: form.is_primary,
      notes: form.notes || null,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("contacts").update(payload).eq("id", contact.id));
    } else {
      ({ error } = await supabase.from("contacts").insert(payload));
    }

    if (error) {
      setError("שגיאה בשמירת הנתונים");
      setLoading(false);
      return;
    }

    router.push(`/clients/${clientId}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם פרטי *</label>
            <input
              type="text"
              required
              value={form.first_name}
              onChange={(e) => update("first_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם משפחה *</label>
            <input
              type="text"
              required
              value={form.last_name}
              onChange={(e) => update("last_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד</label>
            <input
              type="text"
              value={form.role_title}
              onChange={(e) => update("role_title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ראש מועצה, גזבר..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              type="tel"
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
              placeholder="אם שונה מהטלפון"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_primary}
                onChange={(e) => update("is_primary", e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                איש קשר ראשי
              </span>
            </label>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "שומר..." : isEdit ? "שמור שינויים" : "הוסף איש קשר"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
