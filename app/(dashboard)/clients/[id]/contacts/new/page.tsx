import { getCurrentUser } from "@/lib/auth";
import { getRepository, Client } from "@/lib/db";
import { ContactForm } from "@/components/features/contacts/ContactForm";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewContactPage({ params }: Props) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  const clientRepo = await getRepository(Client);
  const client = await clientRepo.findOne({
    where: { id, organizationId: auth.payload.organizationId },
    select: { id: true, name: true },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">הוספת איש קשר</h2>
        <p className="text-gray-500 mt-1">עבור: {client.name}</p>
      </div>
      <ContactForm
        clientId={id}
        organizationId={auth.payload.organizationId}
      />
    </div>
  );
}
