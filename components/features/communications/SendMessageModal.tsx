"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, Send } from "lucide-react";
import { TEMPLATE_TYPE_LABELS } from "@/lib/utils/hebrew-status";
import { parseTemplate } from "@/lib/utils/template-parser";
import type { Client, Contact, Template, TemplateType } from "@/types/database";

interface SendMessageModalProps {
  client: Client;
  onClose: () => void;
}

export function SendMessageModal({ client, onClose }: SendMessageModalProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState({
    type: "sms" as TemplateType,
    contact_id: "",
    template_id: "",
    subject: "",
    body: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [{ data: c }, { data: t }] = await Promise.all([
        supabase
          .from("contacts")
          .select("*")
          .eq("client_id", client.id)
          .is("deleted_at", null),
        supabase.from("templates").select("*").order("name"),
      ]);
      setContacts(c ?? []);
      setTemplates(t ?? []);
    };
    load();
  }, [client.id]);

  const handleTemplateSelect = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) {
      setForm((p) => ({ ...p, template_id: "" }));
      return;
    }
    const selectedContact = contacts.find((c) => c.id === form.contact_id);
    const body = parseTemplate(tmpl.body, {
      council_name: client.name,
      contact_name: selectedContact
        ? `${selectedContact.first_name} ${selectedContact.last_name}`
        : "",
    });
    setForm((p) => ({
      ...p,
      template_id: templateId,
      type: tmpl.type,
      subject: tmpl.subject ?? "",
      body,
    }));
  };

  const selectedContact = contacts.find((c) => c.id === form.contact_id);
  const charCount = form.body.length;
  const smsPages = Math.ceil(charCount / 160);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          to_phone: selectedContact?.phone,
          to_email: selectedContact?.email,
          subject: form.subject || undefined,
          body: form.body,
          client_id: client.id,
          contact_id: form.contact_id || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "שגיאה בשליחה");

      setSuccess("ההודעה נשלחה בהצלחה!");
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((t) => t.type === form.type);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">שלח הודעה</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">
            מועצה: <strong>{client.name}</strong>
          </div>

          {/* Type */}
          <div className="flex gap-2">
            {(["sms", "email", "whatsapp"] as TemplateType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((p) => ({ ...p, type: t, template_id: "", body: "" }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.type === t
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {TEMPLATE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Contact */}
          {contacts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                נמען
              </label>
              <select
                value={form.contact_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contact_id: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר איש קשר</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                    {c.phone ? ` (${c.phone})` : ""}
                    {c.email ? ` (${c.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Template */}
          {filteredTemplates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תבנית
              </label>
              <select
                value={form.template_id}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר תבנית (אופציונלי)</option>
                {filteredTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Email subject */}
          {form.type === "email" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                נושא *
              </label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subject: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תוכן ההודעה *
            </label>
            <textarea
              required
              value={form.body}
              onChange={(e) =>
                setForm((p) => ({ ...p, body: e.target.value }))
              }
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {form.type === "sms" && (
              <p className="text-xs text-gray-500 mt-1">
                {charCount} תווים · {smsPages} הודעה/ות SMS
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              {success}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !form.body}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {loading ? "שולח..." : "שלח הודעה"}
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
