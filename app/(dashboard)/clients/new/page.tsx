import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "@/components/features/clients/ClientForm";
import { redirect } from "next/navigation";

export default async function NewClientPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", profile?.organization_id ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">מועצה חדשה</h2>
        <p className="text-gray-500 mt-1">הוסף מועצה אזורית חדשה למערכת</p>
      </div>
      <ClientForm
        profiles={(profiles ?? []) as any}
        organizationId={profile?.organization_id ?? ""}
      />
    </div>
  );
}
