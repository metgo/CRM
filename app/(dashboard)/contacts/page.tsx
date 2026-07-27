import { getCurrentUser } from "@/lib/auth";
import { getRepository, Contact } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { IsNull } from "typeorm";

export default async function ContactsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  const contactRepo = await getRepository(Contact);
  const contacts = await contactRepo.find({
    where: {
      organizationId: auth.payload.organizationId,
      deletedAt: IsNull(),
    },
    relations: { client: true },
    order: { createdAt: "DESC" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">אנשי קשר</h2>
        <p className="text-gray-500 mt-1">{contacts.length} אנשי קשר</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">תפקיד</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">מועצה</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">טלפון</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">אימייל</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!contacts.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                    לא נמצאו אנשי קשר
                  </td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {c.firstName} {c.lastName}
                          {c.isPrimary && <span className="text-yellow-500 mr-1">★</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.roleTitle ?? "—"}</td>
                    <td className="px-4 py-3">
                      {c.client && (
                        <Link
                          href={`/clients/${c.clientId}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {c.client.name}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                          <Phone className="w-3 h-3" />{c.phone}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                          <Mail className="w-3 h-3" />{c.email}
                        </a>
                      ) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
