import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/features/dashboard/DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, full_name")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id ?? "";

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalClients },
    { count: activeClients },
    { count: openReminders },
    { count: messagesSent },
    { data: recentComms },
    { data: upcomingReminders },
    { data: clientsByStatus },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .is("deleted_at", null),
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "active")
      .is("deleted_at", null),
    supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_done", false),
    supabase
      .from("communications")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("type", ["sms", "email", "whatsapp"])
      .gte("created_at", monthStart),
    supabase
      .from("communications")
      .select("*, clients(name), contacts(first_name, last_name), profiles(full_name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("reminders")
      .select("*, clients(name)")
      .eq("organization_id", orgId)
      .eq("is_done", false)
      .gte("due_at", now.toISOString())
      .order("due_at", { ascending: true })
      .limit(5),
    supabase
      .from("clients")
      .select("status")
      .eq("organization_id", orgId)
      .is("deleted_at", null),
  ]);

  // Group clients by status for chart
  const statusCounts: Record<string, number> = {};
  clientsByStatus?.forEach((c) => {
    statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;
  });

  return (
    <DashboardContent
      userName={profile?.full_name ?? ""}
      kpis={{
        totalClients: totalClients ?? 0,
        activeClients: activeClients ?? 0,
        openReminders: openReminders ?? 0,
        messagesSent: messagesSent ?? 0,
      }}
      recentCommunications={recentComms ?? []}
      upcomingReminders={upcomingReminders ?? []}
      statusCounts={statusCounts}
    />
  );
}
