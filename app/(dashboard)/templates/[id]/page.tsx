import { createClient } from "@/lib/supabase/server";
import { TemplateForm } from "@/components/features/templates/TemplateForm";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: template }] = await Promise.all([
    supabase.from("profiles").select("organization_id").eq("id", user.id).single(),
    supabase.from("templates").select("*").eq("id", id).single(),
  ]);

  if (!template) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">עריכת תבנית</h2>
        <p className="text-gray-500 mt-1">{template.name}</p>
      </div>
      <TemplateForm template={template} organizationId={profile?.organization_id ?? ""} />
    </div>
  );
}
