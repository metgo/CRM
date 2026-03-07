import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
  COMMUNICATION_TYPE_LABELS,
  COMMUNICATION_TYPE_ICONS,
} from "@/lib/utils/hebrew-status";
import { ContactsList } from "@/components/features/contacts/ContactsList";
import { ClientActions } from "@/components/features/clients/ClientActions";
import { RemindersList } from "@/components/features/reminders/RemindersList";
import { Pencil, Globe, MapPin, Calendar } from "lucide-react";
import type { Client, Contact, ReminderWithClient, ClientStatus, CommunicationType } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: contacts }, { data: communications }, { data: reminders }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("*, profiles(full_name)")
        .eq("id", id)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("contacts")
        .select("*")
        .eq("client_id", id)
        .is("deleted_at", null)
        .order("is_primary", { ascending: false }),
      supabase
        .from("communications")
        .select("*, contacts(first_name, last_name), profiles(full_name)")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("reminders")
        .select("*, clients(name)")
        .eq("client_id", id)
        .eq("is_done", false)
        .order("due_at", { ascending: true }),
    ]);

  if (!client) notFound();
  const typedClient = client as Client & { profiles: { full_name: string } | null };
  const typedContacts = (contacts ?? []) as Contact[];
  const typedReminders = (reminders ?? []) as ReminderWithClient[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{typedClient.name}</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${CLIENT_STATUS_COLORS[typedClient.status as ClientStatus]}`}
              >
                {CLIENT_STATUS_LABELS[typedClient.status as ClientStatus]}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {typedClient.region && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {typedClient.region}
                </span>
              )}
              {typedClient.website && (
                <a
                  href={typedClient.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Globe className="w-4 h-4" /> אתר אינטרנט
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                נוצר{" "}
                {format(new Date(typedClient.created_at), "dd/MM/yyyy", {
                  locale: he,
                })}
              </span>
            </div>

            {typedClient.notes && (
              <p className="mt-3 text-sm text-gray-600 max-w-xl">
                {typedClient.notes}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <ClientActions client={typedClient} />
            <Link
              href={`/clients/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              עריכה
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Communications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Communications Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">היסטוריית תקשורת</h3>
              <span className="text-sm text-gray-500">
                {communications?.length ?? 0} רשומות
              </span>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {!communications?.length ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  אין רשומות תקשורת עדיין
                </div>
              ) : (
                communications.map((comm) => (
                  <div key={comm.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">
                        {COMMUNICATION_TYPE_ICONS[comm.type as CommunicationType]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {COMMUNICATION_TYPE_LABELS[comm.type as CommunicationType]}
                          </span>
                          {comm.contacts && (
                            <span className="text-xs text-gray-500">
                              עם {comm.contacts.first_name}{" "}
                              {comm.contacts.last_name}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 mr-auto">
                            {format(
                              new Date(comm.created_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: he }
                            )}
                          </span>
                        </div>
                        {comm.subject && (
                          <p className="text-sm font-medium text-gray-700">
                            {comm.subject}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {comm.body}
                        </p>
                        {comm.profiles && (
                          <p className="text-xs text-gray-400 mt-1">
                            על ידי: {comm.profiles.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contacts */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">אנשי קשר</h3>
              <Link
                href={`/clients/${id}/contacts/new`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + הוסף
              </Link>
            </div>
            <ContactsList contacts={typedContacts} clientId={id} />
          </div>

          {/* Reminders */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                תזכורות ({typedReminders.length})
              </h3>
            </div>
            <RemindersList reminders={typedReminders} clientId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
