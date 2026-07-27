import { getCurrentUser } from "@/lib/auth";
import { getRepository, Reminder } from "@/lib/db";
import { redirect } from "next/navigation";
import { RemindersPageContent } from "@/components/features/reminders/RemindersPageContent";

export default async function RemindersPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  const reminderRepo = await getRepository(Reminder);
  const reminders = await reminderRepo.find({
    where: { organizationId: auth.payload.organizationId },
    relations: { client: true },
    order: { dueAt: "ASC" },
  });

  const remindersData = reminders.map((r) => ({
    id: r.id,
    organization_id: r.organizationId,
    user_id: r.userId,
    client_id: r.clientId,
    title: r.title,
    notes: r.notes,
    due_at: r.dueAt.toISOString(),
    is_done: r.isDone,
    done_at: r.doneAt?.toISOString() ?? null,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
    clients: r.client ? { id: r.client.id, name: r.client.name } : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">תזכורות</h2>
          <p className="text-gray-500 mt-1">
            {remindersData.filter((r) => !r.is_done).length} תזכורות פתוחות
          </p>
        </div>
      </div>
      <RemindersPageContent
        reminders={remindersData}
        organizationId={auth.payload.organizationId}
        userId={auth.payload.userId}
      />
    </div>
  );
}
