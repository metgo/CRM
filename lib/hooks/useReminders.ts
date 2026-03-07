"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ReminderWithClient } from "@/types/database";

export function useReminders() {
  const [overdue, setOverdue] = useState<ReminderWithClient[]>([]);
  const [upcoming, setUpcoming] = useState<ReminderWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    const supabase = createClient();
    const now = new Date().toISOString();
    const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("reminders")
      .select("*, clients(id, name)")
      .eq("is_done", false)
      .order("due_at", { ascending: true });

    if (data) {
      setOverdue(
        (data as ReminderWithClient[]).filter((r) => r.due_at < now)
      );
      setUpcoming(
        (data as ReminderWithClient[]).filter(
          (r) => r.due_at >= now && r.due_at <= in48h
        )
      );
    }
    setLoading(false);
  }, []);

  const markDone = useCallback(
    async (id: string) => {
      const supabase = createClient();
      await supabase
        .from("reminders")
        .update({ is_done: true, done_at: new Date().toISOString() })
        .eq("id", id);
      fetchReminders();
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
