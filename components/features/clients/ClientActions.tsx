"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SendMessageModal } from "@/components/features/communications/SendMessageModal";
import { LogCommunicationModal } from "@/components/features/communications/LogCommunicationModal";
import { ReminderModal } from "@/components/features/reminders/ReminderModal";
import { MessageSquare, Bell, Phone } from "lucide-react";
import type { Client } from "@/types/database";

interface ClientActionsProps {
  client: Client;
}

export function ClientActions({ client }: ClientActionsProps) {
  const [showSend, setShowSend] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setShowSend(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          שלח הודעה
        </button>
        <button
          onClick={() => setShowLog(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <Phone className="w-4 h-4" />
          לוג שיחה
        </button>
        <button
          onClick={() => setShowReminder(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <Bell className="w-4 h-4" />
          תזכורת
        </button>
      </div>

      {showSend && (
        <SendMessageModal
          client={client}
          onClose={() => setShowSend(false)}
        />
      )}
      {showLog && (
        <LogCommunicationModal
          client={client}
          onClose={() => setShowLog(false)}
        />
      )}
      {showReminder && (
        <ReminderModal
          client={client}
          onClose={() => setShowReminder(false)}
        />
      )}
    </>
  );
}
