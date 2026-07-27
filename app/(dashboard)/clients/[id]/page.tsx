import { getCurrentUser } from "@/lib/auth";
import { getRepository, Client, Contact, Communication, Reminder } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
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
import type { ClientStatus, CommunicationType } from "@/types/database";
import { IsNull } from "typeorm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");

  const clientRepo = await getRepository(Client);
  const contactRepo = await getRepository(Contact);
  const commRepo = await getRepository(Communication);
  const reminderRepo = await getRepository(Reminder);

  const [client, contacts, communications, reminders] = await Promise.all([
    clientRepo.findOne({
      where: {
        id,
        organizationId: auth.payload.organizationId,
        deletedAt: IsNull(),
      },
      relations: { assignedTo: true },
    }),
    contactRepo.find({
      where: {
        clientId: id,
        organizationId: auth.payload.organizationId,
        deletedAt: IsNull(),
      },
      order: { isPrimary: "DESC", createdAt: "DESC" },
    }),
    commRepo.find({
      where: {
        clientId: id,
        organizationId: auth.payload.organizationId,
      },
      relations: { contact: true, user: true },
      order: { createdAt: "DESC" },
      take: 20,
    }),
    reminderRepo.find({
      where: {
        clientId: id,
        organizationId: auth.payload.organizationId,
        isDone: false,
      },
      relations: { client: true },
      order: { dueAt: "ASC" },
    }),
  ]);

  if (!client) notFound();

  const typedClient = {
    id: client.id,
    organization_id: client.organizationId,
    name: client.name,
    status: client.status as ClientStatus,
    region: client.region,
    address: client.address,
    website: client.website,
    notes: client.notes,
    assigned_to: client.assignedToId,
    deleted_at: client.deletedAt?.toISOString() ?? null,
    created_at: client.createdAt.toISOString(),
    updated_at: client.updatedAt.toISOString(),
    profiles: client.assignedTo ? { full_name: client.assignedTo.fullName } : null,
  };

  const typedContacts = contacts.map((c) => ({
    id: c.id,
    organization_id: c.organizationId,
    client_id: c.clientId,
    first_name: c.firstName,
    last_name: c.lastName,
    role_title: c.roleTitle,
    phone: c.phone,
    email: c.email,
    whatsapp: c.whatsapp,
    is_primary: c.isPrimary,
    notes: c.notes,
    deleted_at: c.deletedAt?.toISOString() ?? null,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  }));

  const typedReminders = reminders.map((r) => ({
    id: r.id,
    organization_id: r.organizationId,
    user_id: r.userId,
    client_id: r.clientId,
    title: r.title,
    notes: r.notes,
    due_at: r.dueAt.toISOString(),
    is_done: r.isDone,
    done_at: r.doneAt?.toISOString() ?? null,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
    clients: r.client ? { id: r.client.id, name: r.client.name } : null,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{typedClient.name}</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${CLIENT_STATUS_COLORS[typedClient.status]}`}
              >
                {CLIENT_STATUS_LABELS[typedClient.status]}
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
                {communications.length} רשומות
              </span>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {!communications.length ? (
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
                          {comm.contact && (
                            <span className="text-xs text-gray-500">
                              עם {comm.contact.firstName}{" "}
                              {comm.contact.lastName}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 mr-auto">
                            {format(
                              new Date(comm.createdAt),
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
                        {comm.user && (
                          <p className="text-xs text-gray-400 mt-1">
                            על ידי: {comm.user.fullName}
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
