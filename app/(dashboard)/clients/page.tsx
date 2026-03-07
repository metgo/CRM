import { createClient } from "@/lib/supabase/server";
import { ClientsTable } from "@/components/features/clients/ClientsTable";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*, profiles(full_name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">מועצות</h2>
          <p className="text-gray-500 mt-1">
            {clients?.length ?? 0} מועצות במערכת
          </p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          מועצה חדשה
        </Link>
      </div>

      <ClientsTable clients={clients ?? []} />
    </div>
  );
}
