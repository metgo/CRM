"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEMPLATE_VARIABLES, parseTemplate } from "@/lib/utils/template-parser";
import { TEMPLATE_TYPE_LABELS } from "@/lib/utils/hebrew-status";
import type { Template, TemplateType } from "@/types/database";
import { Trash2 } from "lucide-react";

// re-export for use in the form
const TYPES: TemplateType[] = ["sms", "email", "whatsapp"];

interface TemplateFormProps {
  template?: Template;
  organizationId: string;
}

export function TemplateForm({ template, organizationId }: TemplateFormProps) {
  const router = useRouter();
  const isEdit = !!template;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState({
    name: template?.name ?? "",
    type: (template?.type ?? "sms") as TemplateType,
    subject: template?.subject ?? "",
    body: template?.body ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody =
      form.body.substring(0, start) + variable + form.body.substring(end);
    setForm((p) => ({ ...p, body: newBody }));
    setTimeout(() => {
      textarea.setSelectionRange(
        start + variable.length,
        start + variable.length
      );
      textarea.focus();
    }, 0);
  };

  const preview = parseTemplate(form.body, {
    contact_name: "ישראל ישראלי",
    council_name: "מועצה אזורית לדוגמה",
    user_name: "משתמש המערכת",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      name: form.name,
      type: form.type,
      subject: form.subject || null,
      body: form.body,
      organization_id: organizationId,
      variables: TEMPLATE_VARIABLES
        .filter((v) => form.body.includes(v.key))
        .map((v) => v.key),
      created_by: user?.id,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("templates").update(payload).eq("id", template.id));
    } else {
      ({ error } = await supabase.from("templates").insert(payload));
    }

    if (error) {
      setError("שגיאה בשמירת התבנית");
      setLoading(false);
      return;
    }

    router.push("/templates");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("האם למחוק את התבנית?")) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("templates").delete().eq("id", template!.id);
    router.push("/templates");
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">פרטי התבנית</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם התבנית *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="לדוגמה: הצעת מחיר ראשונית"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סוג
            </label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type: t }))}
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
          </div>

          {form.type === "email" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                נושא
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Variable chips */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              הוסף משתנה דינמי:
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-mono hover:bg-blue-100 transition-colors"
                >
                  {v.key} <span className="font-sans text-blue-500">({v.label})</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תוכן ההודעה *
            </label>
            <textarea
              ref={textareaRef}
              required
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              placeholder="שלום {{contact_name}},&#10;&#10;..."
            />
            {form.type === "sms" && (
              <p className="text-xs text-gray-500 mt-1">
                {form.body.length} תווים
              </p>
            )}
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
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "שומר..." : isEdit ? "שמור שינויים" : "צור תבנית"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            ביטול
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="mr-auto flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              מחק תבנית
            </button>
          )}
        </div>
      </form>

      {/* Preview */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">תצוגה מקדימה</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-32">
            {form.subject && (
              <p className="text-sm font-medium text-gray-700 mb-2">
                נושא: {form.subject}
              </p>
            )}
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{preview || "ההודעה תופיע כאן..."}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">* הצגה עם ערכי דוגמה</p>
        </div>
      </div>
    </div>
  );
}
