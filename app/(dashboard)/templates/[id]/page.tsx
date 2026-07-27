import { getCurrentUser } from "@/lib/auth";
import { getRepository, Template } from "@/lib/db";
import { TemplateForm } from "@/components/features/templates/TemplateForm";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: Props) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  const templateRepo = await getRepository(Template);
  const template = await templateRepo.findOne({
    where: { id, organizationId: auth.payload.organizationId },
  });

  if (!template) notFound();

  const templateData = {
    id: template.id,
    organization_id: template.organizationId,
    name: template.name,
    type: template.type,
    subject: template.subject,
    body: template.body,
    variables: template.variables,
    created_by: template.createdById,
    created_at: template.createdAt.toISOString(),
    updated_at: template.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">עריכת תבנית</h2>
        <p className="text-gray-500 mt-1">{template.name}</p>
      </div>
      <TemplateForm template={templateData} organizationId={auth.payload.organizationId} />
    </div>
  );
}
