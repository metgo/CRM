"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReminderWithClient } from "@/types/database";

export function useReminders() {
  const [overdue, setOverdue] = useState<ReminderWithClient[]>([]);
  const [upcoming, setUpcoming] = useState<ReminderWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders");
      if (!res.ok) return;

      const data = await res.json();
      const now = new Date().toISOString();
      const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      setOverdue(
        (data as ReminderWithClient[]).filter((r) => r.due_at < now)
      );
      setUpcoming(
        (data as ReminderWithClient[]).filter(
          (r) => r.due_at >= now && r.due_at <= in48h
        )
      );
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  }, []);

  const markDone = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/reminders/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_done: true }),
        });
        fetchReminders();
      } catch {
        // Ignore errors
      }
    },
    [fetchReminders]
  );

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 60_000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  const totalActive = overdue.length + upcoming.length;

  return { overdue, upcoming, totalActive, loading, refetch: fetchReminders, markDone };
}
