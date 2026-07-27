import { getCurrentUser } from "@/lib/auth";
import { TemplateForm } from "@/components/features/templates/TemplateForm";
import { redirect } from "next/navigation";

export default async function NewTemplatePage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">תבנית חדשה</h2>
        <p className="text-gray-500 mt-1">צור תבנית הודעה לשימוש חוזר</p>
      </div>
      <TemplateForm organizationId={auth.payload.organizationId} />
    </div>
  );
}
