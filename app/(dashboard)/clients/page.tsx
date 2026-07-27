import { getCurrentUser } from "@/lib/auth";
import { getRepository, Client } from "@/lib/db";
import { ClientsTable } from "@/components/features/clients/ClientsTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { IsNull } from "typeorm";

export default async function ClientsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  const clientRepo = await getRepository(Client);
  const clients = await clientRepo.find({
    where: {
      organizationId: auth.payload.organizationId,
      deletedAt: IsNull(),
    },
    relations: { assignedTo: true },
    order: { createdAt: "DESC" },
  });

  // Transform to match expected format
  const clientsData = clients.map((c) => ({
    id: c.id,
    organization_id: c.organizationId,
    name: c.name,
    status: c.status,
    region: c.region,
    address: c.address,
    website: c.website,
    notes: c.notes,
    assigned_to: c.assignedToId,
    deleted_at: c.deletedAt?.toISOString() ?? null,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
    profiles: c.assignedTo ? { full_name: c.assignedTo.fullName } : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">מועצות</h2>
          <p className="text-gray-500 mt-1">
            {clientsData.length} מועצות במערכת
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

      <ClientsTable clients={clientsData} />
    </div>
  );
}
