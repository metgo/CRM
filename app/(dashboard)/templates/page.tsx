import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { TEMPLATE_TYPE_LABELS } from "@/lib/utils/hebrew-status";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default async function TemplatesPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">תבניות הודעה</h2>
          <p className="text-gray-500 mt-1">{templates?.length ?? 0} תבניות</p>
        </div>
        <Link
          href="/templates/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          תבנית חדשה
        </Link>
      </div>

      {!templates?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">אין תבניות עדיין</p>
          <Link
            href="/templates/new"
            className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
          >
            צור תבנית ראשונה
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Link key={t.id} href={`/templates/${t.id}`}>
              <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {TEMPLATE_TYPE_LABELS[t.type as keyof typeof TEMPLATE_TYPE_LABELS]}
                  </span>
                </div>
                {t.subject && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>נושא:</strong> {t.subject}
                  </p>
                )}
                <p className="text-sm text-gray-500 line-clamp-3">{t.body}</p>
                <p className="text-xs text-gray-400 mt-3">
                  {format(new Date(t.created_at), "dd/MM/yyyy", { locale: he })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
