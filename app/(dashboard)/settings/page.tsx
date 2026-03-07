import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">הגדרות</h2>
        <p className="text-gray-500 mt-1">ניהול פרטי המשתמש</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">פרטי המשתמש</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">שם מלא</p>
            <p className="font-medium text-gray-900 mt-0.5">{profile?.full_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">כתובת אימייל</p>
            <p className="font-medium text-gray-900 mt-0.5 dir-ltr">{user.email}</p>
          </div>
          <div>
            <p className="text-gray-500">תפקיד</p>
            <p className="font-medium text-gray-900 mt-0.5">
              {profile?.role === "admin" ? "מנהל" : "סוכן"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">INFORU API</h3>
        <p className="text-sm text-gray-500">
          הגדרות חיבור ל-INFORU לשליחת SMS ואימייל.
          ניתן לעדכן דרך משתני הסביבה של Vercel.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-600 space-y-1">
          <p>INFORU_USERNAME=...</p>
          <p>INFORU_API_KEY=...</p>
          <p>INFORU_SENDER_NAME=MetGo</p>
        </div>
      </div>
    </div>
  );
}
