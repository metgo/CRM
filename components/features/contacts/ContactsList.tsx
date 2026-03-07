"use client";

import { Phone, Mail, Star } from "lucide-react";
import type { Contact } from "@/types/database";

interface ContactsListProps {
  contacts: Contact[];
  clientId: string;
}

export function ContactsList({ contacts, clientId }: ContactsListProps) {
  if (!contacts.length) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        אין אנשי קשר עדיין
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {contacts.map((contact) => (
        <div key={contact.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm flex-shrink-0">
              {contact.first_name[0]}
              {contact.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-gray-900">
                  {contact.first_name} {contact.last_name}
                </p>
                {contact.is_primary && (
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              {contact.role_title && (
                <p className="text-xs text-gray-500">{contact.role_title}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-1">
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <Mail className="w-3 h-3" />
                    {contact.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
