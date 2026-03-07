import { createClient } from "@/lib/supabase/server";
import { RemindersPageContent } from "@/components/features/reminders/RemindersPageContent";
import { redirect } from "next/navigation";

export default async function RemindersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const { data: reminders } = await supabase
    .from("reminders")
    .select("*, clients(id, name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("due_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">תזכורות</h2>
          <p className="text-gray-500 mt-1">
            {reminders?.filter((r) => !r.is_done).length ?? 0} תזכורות פתוחות
          </p>
        </div>
      </div>
      <RemindersPageContent reminders={reminders ?? []} organizationId={profile?.organization_id ?? ""} userId={user.id} />
    </div>
  );
}
