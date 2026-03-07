import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  COMMUNICATION_TYPE_LABELS,
  COMMUNICATION_TYPE_ICONS,
} from "@/lib/utils/hebrew-status";

export default async function CommunicationsPage() {
  const supabase = await createClient();

  const { data: communications } = await supabase
    .from("communications")
    .select(
      "*, clients(name), contacts(first_name, last_name), profiles(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">היסטוריית תקשורת</h2>
        <p className="text-gray-500 mt-1">
          {communications?.length ?? 0} רשומות
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">סוג</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">מועצה</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">איש קשר</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">תוכן</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">על ידי</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!communications?.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    אין רשומות תקשורת
                  </td>
                </tr>
              ) : (
                communications.map((comm: any) => (
                  <tr key={comm.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{COMMUNICATION_TYPE_ICONS[comm.type as keyof typeof COMMUNICATION_TYPE_ICONS]}</span>
                        <span className="text-sm text-gray-600">
                          {COMMUNICATION_TYPE_LABELS[comm.type as keyof typeof COMMUNICATION_TYPE_LABELS]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{comm.clients?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {comm.contacts
                        ? `${comm.contacts.first_name} ${comm.contacts.last_name}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 truncate max-w-48">{comm.body}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{comm.profiles?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {format(new Date(comm.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                    </td>
                    <td className="px-4 py-3">
                      {comm.status && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          comm.status === "sent" ? "bg-green-100 text-green-800" :
                          comm.status === "failed" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {comm.status === "sent" ? "נשלח" :
                           comm.status === "failed" ? "נכשל" :
                           comm.status === "logged" ? "תועד" : comm.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
