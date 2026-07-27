import { getCurrentUser } from "@/lib/auth";
import { getRepository, Client, Profile } from "@/lib/db";
import { ClientForm } from "@/components/features/clients/ClientForm";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  const clientRepo = await getRepository(Client);
  const profileRepo = await getRepository(Profile);

  const [client, profiles] = await Promise.all([
    clientRepo.findOne({
      where: { id, organizationId: auth.payload.organizationId },
    }),
    profileRepo.find({
      where: { organizationId: auth.payload.organizationId },
      select: { id: true, fullName: true },
      order: { fullName: "ASC" },
    }),
  ]);

  if (!client) notFound();

  const clientData = {
    id: client.id,
    organization_id: client.organizationId,
    name: client.name,
    status: client.status,
    region: client.region,
    address: client.address,
    website: client.website,
    notes: client.notes,
    assigned_to: client.assignedToId,
    deleted_at: client.deletedAt?.toISOString() ?? null,
    created_at: client.createdAt.toISOString(),
    updated_at: client.updatedAt.toISOString(),
  };

  const profilesData = profiles.map((p) => ({
    id: p.id,
    full_name: p.fullName,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">עריכת מועצה</h2>
        <p className="text-gray-500 mt-1">{client.name}</p>
      </div>
      <ClientForm
        client={clientData}
        profiles={profilesData}
        organizationId={auth.payload.organizationId}
      />
    </div>
  );
}
