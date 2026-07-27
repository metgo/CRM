import { getCurrentUser } from "@/lib/auth";
import { getRepository, Client, Reminder, Communication } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/features/dashboard/DashboardContent";
import { IsNull, MoreThanOrEqual, In } from "typeorm";

export default async function DashboardPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  const orgId = auth.payload.organizationId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const clientRepo = await getRepository(Client);
  const reminderRepo = await getRepository(Reminder);
  const commRepo = await getRepository(Communication);

  const [
    totalClients,
    activeClients,
    openReminders,
    messagesSent,
    recentComms,
    upcomingReminders,
    clientsByStatus,
  ] = await Promise.all([
    clientRepo.count({
      where: { organizationId: orgId, deletedAt: IsNull() },
    }),
    clientRepo.count({
      where: { organizationId: orgId, status: "active", deletedAt: IsNull() },
    }),
    reminderRepo.count({
      where: { organizationId: orgId, isDone: false },
    }),
    commRepo.count({
      where: {
        organizationId: orgId,
        type: In(["sms", "email", "whatsapp"]),
        createdAt: MoreThanOrEqual(monthStart),
      },
    }),
    commRepo.find({
      where: { organizationId: orgId },
      relations: { client: true, contact: true, user: true },
      order: { createdAt: "DESC" },
      take: 10,
    }),
    reminderRepo.find({
      where: {
        organizationId: orgId,
        isDone: false,
        dueAt: MoreThanOrEqual(now),
      },
      relations: { client: true },
      order: { dueAt: "ASC" },
      take: 5,
    }),
    clientRepo.find({
      where: { organizationId: orgId, deletedAt: IsNull() },
      select: { status: true },
    }),
  ]);

  // Group clients by status for chart
  const statusCounts: Record<string, number> = {};
  clientsByStatus.forEach((c) => {
    statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;
  });

  // Transform to expected format
  const recentCommunications = recentComms.map((c) => ({
    id: c.id,
    type: c.type,
    body: c.body,
    created_at: c.createdAt.toISOString(),
    clients: c.client ? { name: c.client.name } : null,
    contacts: c.contact
      ? { first_name: c.contact.firstName, last_name: c.contact.lastName }
      : null,
    profiles: c.user ? { full_name: c.user.fullName } : null,
  }));

  const upcomingRemindersData = upcomingReminders.map((r) => ({
    id: r.id,
    title: r.title,
    due_at: r.dueAt.toISOString(),
    clients: r.client ? { name: r.client.name } : null,
  }));

  return (
    <DashboardContent
      userName={auth.user.fullName}
      kpis={{
        totalClients,
        activeClients,
        openReminders,
        messagesSent,
      }}
      recentCommunications={recentCommunications}
      upcomingReminders={upcomingRemindersData}
      statusCounts={statusCounts}
    />
  );
}
