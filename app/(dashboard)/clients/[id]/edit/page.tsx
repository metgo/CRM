import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "@/components/features/clients/ClientForm";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: client }, { data: profile }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("profiles").select("organization_id").eq("id", user.id).single(),
  ]);

  if (!client) notFound();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", profile?.organization_id ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">עריכת מועצה</h2>
        <p className="text-gray-500 mt-1">{(client as any).name}</p>
      </div>
      <ClientForm
        client={client as any}
        profiles={(profiles ?? []) as any}
        organizationId={profile?.organization_id ?? ""}
      />
    </div>
  );
}
