import { getCurrentUser } from "@/lib/auth";
import { getRepository, Profile } from "@/lib/db";
import { ClientForm } from "@/components/features/clients/ClientForm";
import { redirect } from "next/navigation";

export default async function NewClientPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  const profileRepo = await getRepository(Profile);
  const profiles = await profileRepo.find({
    where: { organizationId: auth.payload.organizationId },
    select: { id: true, fullName: true },
    order: { fullName: "ASC" },
  });

  const profilesData = profiles.map((p) => ({
    id: p.id,
    full_name: p.fullName,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">מועצה חדשה</h2>
        <p className="text-gray-500 mt-1">הוסף מועצה אזורית חדשה למערכת</p>
      </div>
      <ClientForm
        profiles={profilesData}
        organizationId={auth.payload.organizationId}
      />
    </div>
  );
}
