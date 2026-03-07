import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "@/components/features/contacts/ContactForm";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewContactPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: client }, { data: profile }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("id", id).single(),
    supabase.from("profiles").select("organization_id").eq("id", user.id).single(),
  ]);

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">הוספת איש קשר</h2>
        <p className="text-gray-500 mt-1">עבור: {client.name}</p>
      </div>
      <ContactForm
        clientId={id}
        organizationId={profile?.organization_id ?? ""}
      />
    </div>
  );
}
